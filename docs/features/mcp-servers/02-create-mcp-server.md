<feature>
  <meta>
    <id>mcp_create_server</id>
    <title>Tạo custom MCP server</title>
    <group>MCP Servers</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-05</updated>
  </meta>

  <overview>
    User tạo một MCP server mới (loại "custom"). Server này sẽ chứa các Tools
    do user tự định nghĩa. Mỗi custom server có endpoint riêng biệt để AI
    agents kết nối.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "New MCP Server" trên trang MCP Management</action>
      <benefit>tạo một MCP server mới để nhóm các tools theo domain/mục đích</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút "New MCP Server" trên trang MCP Management.</criterion>
    <criterion id="AC-02">Dialog tạo MCP server với các trường: Name (bắt buộc, unique), Description (optional).</criterion>
    <criterion id="AC-03">Name chỉ chứa alphanumeric, dấu gạch ngang, gạch dưới. Tối đa 100 ký tự.</criterion>
    <criterion id="AC-04">Save → MCP server xuất hiện trong danh sách với badge "Custom".</criterion>
    <criterion id="AC-05">Server mới tạo mặc định isActive = true, type = "custom", chưa có tool nào.</criterion>
    <criterion id="AC-06">API: POST /api/mcp-servers → { name, description? }.</criterion>
    <criterion id="AC-07">Response: MCP server object với id, name, description, type, isActive, endpoint URL, createdAt.</criterion>
  </acceptance-criteria>
</feature>
