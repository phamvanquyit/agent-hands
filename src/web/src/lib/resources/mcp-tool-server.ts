import type { HttpClient } from "../http";
import type {
  McpToolServerItem,
  McpToolItem,
  CreateMcpServerInput,
  UpdateMcpServerInput,
  CreateMcpToolInput,
  UpdateMcpToolInput,
  McpToolListQuery,
  McpToolListResult,
  McpToolTestResult,
} from "../types";

export class McpToolServersResource {
  constructor(private http: HttpClient) {}

  // ── Server CRUD ─────────────────────────────────────────────────────────

  /** List all MCP tool servers */
  async list(): Promise<McpToolServerItem[]> {
    const res = await this.http.get<{ items: McpToolServerItem[]; meta: { total: number } }>(
      "/api/mcp-tool-servers",
    );
    return res.items;
  }

  /** Get server by ID */
  async get(id: string): Promise<McpToolServerItem> {
    return this.http.get<McpToolServerItem>(`/api/mcp-tool-servers/${id}`);
  }

  /** Create a new custom MCP server */
  async create(input: CreateMcpServerInput): Promise<McpToolServerItem> {
    return this.http.post<McpToolServerItem>("/api/mcp-tool-servers", input);
  }

  /** Update server metadata */
  async update(id: string, input: UpdateMcpServerInput): Promise<McpToolServerItem> {
    return this.http.patch<McpToolServerItem>(`/api/mcp-tool-servers/${id}`, input);
  }

  /** Delete a custom server (cascade deletes tools) */
  async delete(id: string): Promise<void> {
    await this.http.delete(`/api/mcp-tool-servers/${id}`);
  }

  // ── Tool CRUD ───────────────────────────────────────────────────────────

  /** List tools for a server */
  async listTools(
    serverId: string,
    query?: McpToolListQuery,
  ): Promise<McpToolListResult> {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return this.http.get<McpToolListResult>(
      `/api/mcp-tool-servers/${serverId}/tools${qs ? `?${qs}` : ""}`,
    );
  }

  /** Get a specific tool */
  async getTool(serverId: string, toolId: string): Promise<McpToolItem> {
    return this.http.get<McpToolItem>(
      `/api/mcp-tool-servers/${serverId}/tools/${toolId}`,
    );
  }

  /** Create a new tool in a server */
  async createTool(
    serverId: string,
    input: CreateMcpToolInput,
  ): Promise<McpToolItem> {
    return this.http.post<McpToolItem>(
      `/api/mcp-tool-servers/${serverId}/tools`,
      input,
    );
  }

  /** Update a tool */
  async updateTool(
    serverId: string,
    toolId: string,
    input: UpdateMcpToolInput,
  ): Promise<McpToolItem> {
    return this.http.patch<McpToolItem>(
      `/api/mcp-tool-servers/${serverId}/tools/${toolId}`,
      input,
    );
  }

  /** Delete a tool */
  async deleteTool(serverId: string, toolId: string): Promise<void> {
    await this.http.delete(
      `/api/mcp-tool-servers/${serverId}/tools/${toolId}`,
    );
  }

  /** Test execute a tool */
  async testTool(
    serverId: string,
    toolId: string,
    params?: Record<string, unknown>,
  ): Promise<McpToolTestResult> {
    return this.http.post<McpToolTestResult>(
      `/api/mcp-tool-servers/${serverId}/tools/${toolId}/test`,
      { params: params ?? {} },
    );
  }
}
