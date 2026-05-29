/**
 * MCP Tool Coding Agent
 *
 * AI agent that generates JavaScript code for MCP tools.
 * Uses LangChain/LangGraph for the agent loop with tool calling.
 */

import type { AIMessageChunk } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import TurndownService from "turndown";
import { z } from "zod";
import { fetchBrowser } from "../../common/utils/fetch-browser.js";
import { getChatModelForProvider } from "../llm-providers/llm-provider.chat.js";
import { executeMcpTool } from "./mcp-tool-executor.js";
import { getMcpToolById, updateMcpTool } from "./mcp-tool-server.service.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface McpCodingAgentRequest {
  providerId: string;
  model: string;
  prompt: string;
  currentCode: string;
  serverId: string;
  toolId: string;
  toolName: string;
  toolDescription: string;
  inputSchema: string;
  authToken?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface McpAgentEvent {
  type: "thinking" | "tool_call" | "tool_result" | "text" | "text_delta" | "code" | "done" | "error";
  message?: string;
  code?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: unknown;
  duration?: number;
}

// Event type for code change — includes toolId for frontend to match
export interface McpCodeChangeEvent {
  toolId: string;
  code: string;
}

// ── Test execution ───────────────────────────────────────────────────────────

async function testToolCode(
  code: string,
  serverId: string,
  params: Record<string, unknown>,
  authToken?: string,
): Promise<{
  success: boolean;
  result: unknown;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
}> {
  const sandboxId = `agent_${serverId}`;
  const result = await executeMcpTool(sandboxId, code, params, {
    timeoutMs: 15_000,
    baseUrl: `http://127.0.0.1:${process.env.PORT ?? "18080"}`,
    authToken: authToken ?? "",
  });
  return result;
}

// ── Fetch Web utility ────────────────────────────────────────────────────────

async function fetchWebContent(url: string, mode: "raw" | "md" = "raw"): Promise<string> {
  try {
    const res = await fetchBrowser(url);
    if (!res.ok) return `HTTP Error ${res.status}: ${res.statusText}`;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return JSON.stringify(await res.json(), null, 2).slice(0, 8000);
    }
    const html = await res.text();
    if (mode === "md") {
      const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
      return td.turndown(html).slice(0, 8000);
    }
    return html.slice(0, 8000);
  } catch (err) {
    return `Fetch error: ${(err as Error).message}`;
  }
}

// ── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a JavaScript MCP tool code generator for the Agent Hands.

MCP Tool pattern — EVERY tool MUST use this exact JSDoc + code structure:
\`\`\`javascript
/**
 * @name tool_name_here
 * @description What this tool does (clear and concise)
 * @param {string} query (required) - A search query
 * @param {number} limit (optional) - Max results to return
 */
export default async function execute(params, context) {
  // params: input from AI agent (matches the @param declarations above)
  // context: { log, http, kv, tables }
  //
  // context.log(...args)            — log for debugging
  //
  // ── HTTP helpers ──
  // context.http.get(url, headers?)           — HTTP GET
  // context.http.post(url, data?, headers?)   — HTTP POST
  // context.http.patch(url, data?, headers?)  — HTTP PATCH
  // context.http.delete(url, headers?)        — HTTP DELETE
  //
  // IMPORTANT: http behavior depends on the URL type:
  //   • External URLs (starting with http/https): returns RAW TEXT string.
  //     You MUST call JSON.parse() yourself if the response is JSON.
  //     No Authorization header is sent — the request goes directly to the external API.
  //   • Internal API paths (starting with /api/...): returns parsed JSON object.
  //     Authorization header is sent automatically.
  //
  // ── KV Store ──
  // context.kv.get(key)      — read a value (returns parsed JSON)
  // context.kv.set(key, val) — write a value
  //
  // ── Tables ──
  // context.tables.query(projectId, tableId, filters)
  // context.tables.insert(projectId, tableId, data)

  return { result: "Hello!" };
}
\`\`\`

CRITICAL JSDoc RULES:
- You MUST declare EVERY parameter used in the code as a @param in the JSDoc header
- Format: @param {type} name (required|optional) - description
- Supported types: string, number, boolean, object, array, object[], string[]
- For nested objects: @param {object} filters (optional) - Filter options
                      @param {string} filters.category (optional) - Category filter
- The @param declarations are used to generate the tool's input schema for MCP — if you skip them, AI agents won't know what parameters to send
- @name must be snake_case (lowercase letters, numbers, underscores only)
- @description must be a clear, concise explanation of what the tool does

GENERAL RULES:
- Always export default the execute function
- Return a JSON-serializable value (object, array, string, number)
- You can use fetch() directly for external API calls, but context.http is preferred
- You can import npm packages (e.g. import _ from "lodash")
- NEVER use process.env
- Use context.log() for debugging output
- When calling external APIs via context.http.get(url), the response is a RAW TEXT string — always use JSON.parse() to parse JSON responses
- When calling internal APIs via context.http.get("/api/..."), the response is already a parsed JSON object

WORKFLOW — choose the right approach based on the user's request:

## A) User asks to WRITE or MODIFY code:
1. Analyze the user's request
2. Call write_code with the COMPLETE code
3. IMMEDIATELY call run_test with realistic params — MANDATORY after write_code
4. If the test fails, fix the code with write_code, then call run_test again
5. Repeat write→test cycle until tests pass, then respond with a short text summary

## B) User asks to TEST or DEBUG existing code (e.g. "test this", "run it", "try it"):
1. Call run_test directly with realistic params — use the current code as-is
2. Report the test result
3. If test fails and you can identify the issue, offer to fix with write_code → run_test
4. Do NOT rewrite code unless the user asks you to or the test reveals a bug

## C) User asks a QUESTION (e.g. "what does this do?", "explain the code"):
1. Just respond with text — no tool calls needed

RULES:
- After EVERY write_code call, your VERY NEXT action MUST be run_test. NEVER skip this.
- NEVER call write_code twice in a row without run_test in between.
- Do NOT write code in markdown code blocks. Always use the write_code tool.
- Do NOT rewrite code unnecessarily — if the user just wants to test, use run_test directly.
- When user says "test", "try", "run" etc. without asking for changes → use Workflow B.`;

// ── Tool factory ─────────────────────────────────────────────────────────────

function createLangChainTools(
  reqData: McpCodingAgentRequest,
  fetchWebCount: { count: number },
  codeChangedThisTurn: { value: boolean },
  onEvent: (event: McpAgentEvent) => void,
) {
  // Guard: force model to call run_test after every write_code
  const pendingTest = { value: false };

  const fetchWebTool = tool(
    async ({ url, mode }: { url: string; mode?: string }) => {
      fetchWebCount.count++;
      if (fetchWebCount.count > 10) {
        return `[LIMIT REACHED] You have already made 10 fetch_web calls. Use the information you have to write the code.`;
      }
      return await fetchWebContent(url, (mode as "raw" | "md") ?? "raw");
    },
    {
      name: "fetch_web",
      description: "Fetch content from a URL. Use ONLY when you need to inspect a specific target URL or read unknown API documentation.",
      schema: z.object({
        url: z.string().url(),
        mode: z.enum(["raw", "md"]).optional(),
      }),
    },
  );

  const writeCodeTool = tool(
    async ({ code }: { code: string }) => {
      // If model called write_code again without testing — auto-test the PREVIOUS code first
      if (pendingTest.value) {
        const dbTool = await getMcpToolById(reqData.toolId);
        const prevCode = dbTool?.draftCode ?? dbTool?.code;
        if (prevCode) {
          const autoTestResult = await testToolCode(prevCode, reqData.serverId, {}, reqData.authToken);
          onEvent({ type: "tool_call", toolName: "run_test", toolArgs: { params: "(auto-test: you forgot to call run_test)" } });
          onEvent({ type: "tool_result", toolName: "run_test", toolResult: autoTestResult });
        }
      }

      await updateMcpTool(reqData.serverId, reqData.toolId, { draftCode: code });
      codeChangedThisTurn.value = true;
      pendingTest.value = true;
      onEvent({ type: "code", code });

      // Extract required params from JSDoc to tell model what to pass to run_test
      const paramMatches = [...code.matchAll(/@param\s+\{(\w+)\}\s+([\w.]+)\s+\(required\)(?:\s*-\s*(.+))?/g)];
      const requiredParams = paramMatches.filter((m) => !m[2].includes(".")).map((m) => `${m[2]} (${m[1]})${m[3] ? `: ${m[3].trim()}` : ""}`);

      const paramHint = requiredParams.length > 0 ? ` Required params for run_test: ${requiredParams.join(", ")}.` : "";

      return JSON.stringify({
        success: true,
        nextStep: `⚠️ MANDATORY: Call run_test NOW with realistic params. Do NOT call write_code again.${paramHint}`,
      });
    },
    {
      name: "write_code",
      description: "Save the generated code as a draft. MANDATORY: Your very next tool call after this MUST be run_test. Never call write_code twice in a row.",
      schema: z.object({
        code: z.string().describe("The complete JavaScript code including JSDoc header"),
      }),
    },
  );

  const runTestTool = tool(
    async ({ params }: { params?: Record<string, unknown> }) => {
      pendingTest.value = false;
      const dbTool = await getMcpToolById(reqData.toolId);
      const codeToRun = dbTool?.draftCode ?? dbTool?.code;
      if (!codeToRun) {
        return JSON.stringify({ success: false, result: { error: "no_code", message: "No code found. Call write_code first." } });
      }

      // Parse JSDoc to find required params and reject empty calls
      const paramMatches = [...codeToRun.matchAll(/@param\s+\{(\w+)\}\s+([\w.]+)\s+\(required\)/g)];
      const requiredParams = paramMatches.map((m) => ({ type: m[1], name: m[2] })).filter((p) => !p.name.includes(".")); // skip nested like filters.category

      if (requiredParams.length > 0 && (!params || Object.keys(params).length === 0)) {
        return JSON.stringify({
          success: false,
          error: "empty_params",
          message: `You passed empty params but this tool has ${requiredParams.length} REQUIRED parameter(s). Call run_test again with realistic values.`,
          requiredParams: requiredParams.map((p) => `${p.name}: ${p.type}`),
        });
      }

      const result = await testToolCode(codeToRun, reqData.serverId, params ?? {}, reqData.authToken);
      return JSON.stringify(result);
    },
    {
      name: "run_test",
      description:
        "Test the current draft code with the given params. You MUST provide realistic values for ALL required @param fields declared in the code's JSDoc header.",
      schema: z.object({
        params: z.record(z.unknown()).optional().describe("Test input params — MUST include values for all required @param fields from the JSDoc"),
      }),
    },
  );

  return [fetchWebTool, writeCodeTool, runTestTool];
}

// ── Stream agent and emit events ─────────────────────────────────────────────

async function streamAgentEvents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  agent: any,
  input: { messages: Array<{ role: string; content: string }> },
  onEvent: (event: McpAgentEvent) => void,
): Promise<{ text: string }> {
  let accumulatedText = "";

  // Track tool calls in progress to pair with results and compute duration
  const toolCallTimers = new Map<string, number>();

  const stream = agent.streamEvents(input, {
    version: "v2",
    recursionLimit: 50,
  });

  for await (const event of stream) {
    const eventType = event.event;

    if (eventType === "on_chat_model_stream") {
      // Token-level streaming from the LLM
      const chunk = event.data.chunk as AIMessageChunk;

      // Text content streaming
      if (chunk.content && typeof chunk.content === "string" && chunk.content.length > 0) {
        accumulatedText += chunk.content;
        onEvent({ type: "text_delta", message: chunk.content });
      }

      // Tool call streaming — detect when model starts generating a tool call
      if (chunk.tool_call_chunks && chunk.tool_call_chunks.length > 0) {
        // Tool call chunks are streamed incrementally, we just track them
        // The actual tool_call event will be emitted on_tool_start
      }
    } else if (eventType === "on_tool_start") {
      const toolName = event.name;
      // LangGraph may wrap input in { input: ... } or pass it directly
      let toolInput = event.data?.input;
      // If input is wrapped in an "input" key with a stringified value, unwrap it
      if (toolInput && typeof toolInput === "object" && "input" in toolInput && Object.keys(toolInput).length === 1) {
        const inner = toolInput.input;
        if (typeof inner === "string") {
          try {
            toolInput = JSON.parse(inner);
          } catch {
            toolInput = inner;
          }
        } else {
          toolInput = inner;
        }
      }
      toolCallTimers.set(event.run_id, Date.now());

      // Emit tool_call event
      if (toolName === "write_code") {
        const codeLen = typeof toolInput?.code === "string" ? toolInput.code.length : 0;
        onEvent({ type: "tool_call", toolName, toolArgs: { code: `[${codeLen} chars]` } });
      } else {
        onEvent({ type: "tool_call", toolName, toolArgs: toolInput });
      }
    } else if (eventType === "on_tool_end") {
      const toolName = event.name;
      let toolResult: unknown;

      // LangGraph v2 returns ToolMessage objects with .content property
      // Extract the raw output string from the ToolMessage or use directly
      const rawOutput = event.data?.output;
      let outputStr: string | undefined;

      if (typeof rawOutput === "string") {
        outputStr = rawOutput;
      } else if (rawOutput && typeof rawOutput === "object") {
        // ToolMessage object — extract .content
        const content = (rawOutput as Record<string, unknown>).content;
        if (typeof content === "string") {
          outputStr = content;
        }
      }

      if (outputStr) {
        try {
          toolResult = JSON.parse(outputStr);
        } catch {
          toolResult = outputStr;
        }
      } else {
        toolResult = rawOutput;
      }

      // For fetch_web, truncate the result for display
      if (toolName === "fetch_web" && typeof outputStr === "string") {
        toolResult = outputStr.slice(0, 300) + (outputStr.length > 300 ? "…" : "");
      }

      const startTime = toolCallTimers.get(event.run_id);
      const duration = startTime ? Date.now() - startTime : undefined;
      toolCallTimers.delete(event.run_id);

      onEvent({ type: "tool_result", toolName, toolResult, duration });
    } else if (eventType === "on_chain_start" && event.name === "agent") {
      onEvent({ type: "thinking", message: "Analyzing and planning next step…" });
    } else if (eventType === "on_chain_error") {
      onEvent({ type: "error", message: String(event.data?.error || "Unknown error") });
    }
  }

  return { text: accumulatedText };
}

// ── Run Agent ────────────────────────────────────────────────────────────────

export async function runMcpCodingAgent(reqData: McpCodingAgentRequest, onEvent: (event: McpAgentEvent) => void): Promise<void> {
  const model = await getChatModelForProvider(reqData.providerId, reqData.model);

  const fetchWebCount = { count: 0 };
  const codeChangedThisTurn = { value: false };

  // ── Build messages ──────────────────────────────────────────────────────

  // Embed current code into system prompt so LLM always knows the latest draft
  let systemContent = SYSTEM_PROMPT;
  if (reqData.currentCode) {
    systemContent += `\n\nCurrent code draft:\n\`\`\`javascript\n${reqData.currentCode}\n\`\`\``;
  }

  const hasHistory = reqData.history && reqData.history.length > 0;

  // Build user message
  // - History is embedded as context text (not separate turns) to avoid
  //   validation errors with tool-registered assistant messages
  // - Tool metadata (name, description, inputSchema) only sent on first message
  let userMsg = "";

  if (hasHistory) {
    userMsg += "Previous conversation:\n";
    for (const msg of reqData.history!) {
      userMsg += `[${msg.role.toUpperCase()}]: ${msg.content}\n\n`;
    }
    userMsg += "---\n\nNew request:\n";
  }

  userMsg += reqData.prompt;

  // Only include tool metadata on the first message — LLM already knows from history
  if (!hasHistory) {
    if (reqData.toolName) userMsg += `\n\nTool name: ${reqData.toolName}`;
    if (reqData.toolDescription) userMsg += `\nTool description: ${reqData.toolDescription}`;

    if (reqData.inputSchema) {
      userMsg += `\n\nInput Schema:\n\`\`\`json\n${reqData.inputSchema}\n\`\`\``;
      userMsg += `\n\n⚠️ Provide realistic \`test_params\` that match the input schema above.`;
    }
  }

  const messages = [
    { role: "system", content: systemContent },
    { role: "user", content: userMsg },
  ];

  // ── Create agent graph ──────────────────────────────────────────────────

  const tools = createLangChainTools(reqData, fetchWebCount, codeChangedThisTurn, onEvent);
  const modelWithTools = (model as any).bindTools(tools);

  // Model node: invoke LLM with tool bindings
  async function callModel(state: typeof MessagesAnnotation.State) {
    const response = await modelWithTools.invoke(state.messages);
    return { messages: [response] };
  }

  // Build the agent graph: model → (tools → model)* → end
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("model", callModel)
    .addNode("tools", new ToolNode(tools))
    .addEdge(START, "model")
    .addConditionalEdges("model", toolsCondition, { tools: "tools", [END]: END })
    .addEdge("tools", "model");

  const agent = workflow.compile();

  try {
    await streamAgentEvents(agent, { messages }, onEvent);
  } catch (err) {
    const errObj = err as Record<string, unknown>;
    console.error("[McpCodingAgent] runMcpCodingAgent error:", err);
    if (errObj.responseBody) {
      console.error("[McpCodingAgent] Response body:", String(errObj.responseBody).slice(0, 500));
    }
    onEvent({ type: "error", message: (err as Error).message });
  }

  // Query DB for the latest code to include in done event
  const finalTool = await getMcpToolById(reqData.toolId);
  onEvent({ type: "done", code: finalTool?.draftCode ?? finalTool?.code ?? undefined });
}
