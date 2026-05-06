<feature>
  <meta>
    <id>mcp_management_page</id>
    <title>MCP server management page</title>
    <group>MCP Servers</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-05</updated>
  </meta>

  <overview>
    Trang quản lý tập trung cho tất cả MCP servers. Hiển thị danh sách
    servers (builtin + custom), số lượng tools trong mỗi server, trạng thái
    active/inactive, và actions CRUD.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>navigate tới trang MCP Servers từ sidebar</action>
      <benefit>xem toàn bộ MCP servers và quản lý tools</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Route: /mcp-servers. Sidebar menu item "MCP Servers" với icon phù hợp.</criterion>
    <criterion id="AC-02">Danh sách hiển thị dạng cards hoặc list:
      - Server name
      - Badge: "System" (builtin) hoặc "Custom"
      - Description
      - Số lượng tools
      - Status: Active / Inactive
      - MCP endpoint URL (copyable)
      - Actions: Edit, Delete (chỉ custom), Toggle active
    </criterion>
    <criterion id="AC-03">Built-in server luôn hiển thị đầu tiên, pinned on top.</criterion>
    <criterion id="AC-04">Nút "New MCP Server" ở góc trên phải.</criterion>
    <criterion id="AC-05">Click vào server → navigate tới trang detail: /mcp-servers/:id (hiển thị danh sách tools của server đó).</criterion>
    <criterion id="AC-06">API: GET /api/mcp-servers → { items: McpServer[], meta: { total } }.</criterion>
    <criterion id="AC-07">Empty state khi chưa có custom server: hướng dẫn tạo server đầu tiên.</criterion>
  </acceptance-criteria>
</feature>
