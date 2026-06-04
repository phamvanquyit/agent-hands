import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerBrowserExecute(server: McpServer) {
  server.registerTool(
    "browser_execute",
      {
        description: "Execute a single remote control action on a running browser profile. Supported actions: navigate, click, type, screenshot, get_content, eval, open_tab, close_tab.",
        inputSchema: {
      id: z
        .string()
        .min(1)
        .describe("Browser profile ID (e.g. 'bpr_xxxx'). Profile must be running (use browser_start first)"),
      action: z
        .enum(["navigate", "click", "type", "screenshot", "get_content", "eval", "open_tab", "close_tab"])
        .describe(
          "Action to execute. " +
          "navigate: go to a URL. " +
          "click: click an element by CSS selector. " +
          "type: type text into an input by CSS selector. " +
          "screenshot: capture the current page as base64 PNG. " +
          "get_content: get the page HTML content. " +
          "eval: execute JavaScript code in the page context. " +
          "open_tab: open a new tab (optionally with a URL). " +
          "close_tab: close a tab by index"
        ),
      tabIndex: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Target tab index (0-based, default: 0 = first tab). Use browser_list_tabs to see available tabs"),
      url: z
        .string()
        .url()
        .optional()
        .describe("URL for 'navigate' or 'open_tab' action (must be a valid URL, e.g. 'https://example.com')"),
      selector: z
        .string()
        .optional()
        .describe("CSS selector for 'click' or 'type' action (e.g. '#login-btn', 'input[name=\"email\"]')"),
      text: z
        .string()
        .optional()
        .describe("Text to type for 'type' action"),
      code: z
        .string()
        .optional()
        .describe("JavaScript code to execute for 'eval' action (e.g. 'document.title')"),
        },
      },
    async ({ id, ...body }: {
      id: string;
      action: "navigate" | "click" | "type" | "screenshot" | "get_content" | "eval" | "open_tab" | "close_tab";
      tabIndex?: number;
      url?: string;
      selector?: string;
      text?: string;
      code?: string;
    }) => {
      try {
        const { executeBrowserAction } = await import(
          "../../../../modules/browsers/browser.service.js"
        );
        const result = await executeBrowserAction(id, body);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Internal error";
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: msg }) }],
          isError: true,
        };
      }
    },
  );
}
