<feature>
  <meta>
    <id>mcp_edit_tool</id>
    <title>Chỉnh sửa tool</title>
    <group>MCP Servers</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-05</updated>
  </meta>

  <overview>
    User chỉnh sửa tool đã tạo: cập nhật name, description, input schema,
    hoặc Python code. Thay đổi có hiệu lực ngay — AI agent gọi tool lần sau
    sẽ chạy code mới.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click vào tool trong danh sách để mở editor</action>
      <benefit>cập nhật logic hoặc mô tả tool mà không cần tạo lại</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Click tool name → navigate tới trang edit: /mcp-servers/:serverId/tools/:toolId.</criterion>
    <criterion id="AC-02">Trang edit hiển thị tất cả trường giống trang tạo: Name, Description, Input Schema, Code.</criterion>
    <criterion id="AC-03">Code editor giữ nguyên nội dung code hiện tại.</criterion>
    <criterion id="AC-04">Validation cùng rules với tạo mới (name unique, snake_case, etc.).</criterion>
    <criterion id="AC-05">Save → cập nhật tool, toast thành công. Code mới có hiệu lực ngay.</criterion>
    <criterion id="AC-06">API: PATCH /api/mcp-servers/:serverId/tools/:toolId → { name?, description?, inputSchema?, code? }.</criterion>
    <criterion id="AC-07">Nếu tool không tồn tại → 400 not_found.</criterion>
    <criterion id="AC-08">Không cho edit system tools của built-in server → 403 forbidden.</criterion>
  </acceptance-criteria>
</feature>
