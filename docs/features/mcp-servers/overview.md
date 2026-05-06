<feature>
  <meta>
    <id>mcp_servers_overview</id>
    <title>MCP Servers — Overview</title>
    <group>MCP Servers</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-05</updated>
  </meta>

  <overview>
    Quản lý MCP (Model Context Protocol) servers. Hệ thống có một MCP server
    mặc định (Built-in) chứa các system tools — đây là gateway để AI agents
    tương tác với toàn bộ tài nguyên của toolkit (Variables, Tables, Documents,
    Storage). Ngoài ra, user có thể tạo thêm **Custom MCP servers** — mỗi
    server là một tập hợp các Tools do user tự định nghĩa bằng Python code.

    **Kiến trúc:**
    - **Built-in MCP Server**: Luôn tồn tại, không xoá được. Tự động expose
      các system tools (CRUD Variables, Tables, Documents, Files).
    - **Custom MCP Server**: User tạo mới. Chứa các Tools do user viết Python
      code. Mỗi server có endpoint riêng để AI agents kết nối.
    - **Tools**: Đơn vị nhỏ nhất — một function Python chạy trong sandbox.
      Tool thuộc về một MCP server cụ thể.
  </overview>
</feature>

## Tính năng (atomic — theo thứ tự ưu tiên)

### MCP Server Management

| #  | Tính năng                         | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | Built-in MCP server (system)      | [01-builtin-mcp.md](01-builtin-mcp.md)                         | ✅ Done    | p0       |
| 02 | Tạo custom MCP server             | [02-create-mcp-server.md](02-create-mcp-server.md)              | ✅ Done    | p0       |
| 03 | Chỉnh sửa MCP server              | [03-edit-mcp-server.md](03-edit-mcp-server.md)                  | ✅ Done    | p0       |
| 04 | Xoá MCP server                    | [04-delete-mcp-server.md](04-delete-mcp-server.md)              | ✅ Done    | p0       |
| 05 | MCP server management page        | [05-mcp-management.md](05-mcp-management.md)                    | ✅ Done    | p0       |
| 06 | MCP server connection endpoint    | [06-mcp-endpoint.md](06-mcp-endpoint.md)                        | ⬜ Planned | p0       |

### Tool Management

| #  | Tính năng                         | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 07 | Tạo tool mới                      | [07-create-tool.md](07-create-tool.md)                          | ✅ Done    | p0       |
| 08 | Chỉnh sửa tool                    | [08-edit-tool.md](08-edit-tool.md)                              | ✅ Done    | p0       |
| 09 | Xoá tool                          | [09-delete-tool.md](09-delete-tool.md)                          | ✅ Done    | p0       |
| 10 | Tool code editor                  | [10-tool-code-editor.md](10-tool-code-editor.md)                | ✅ Done    | p0       |
| 11 | Python sandbox executor            | [11-python-sandbox.md](11-python-sandbox.md)                    | ✅ Done    | p0       |
| 12 | Tool test panel                   | [12-tool-test-panel.md](12-tool-test-panel.md)                  | ✅ Done    | p1       |
| 13 | Toggle tool active/inactive       | [13-toggle-tool.md](13-toggle-tool.md)                          | ✅ Done    | p1       |
| 14 | Tool execution logs               | [14-tool-logs.md](14-tool-logs.md)                              | ⬜ Planned | p2       |

