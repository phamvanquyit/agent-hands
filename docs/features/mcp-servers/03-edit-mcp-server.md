<feature>
  <meta>
    <id>mcp_edit_server</id>
    <title>Chỉnh sửa MCP server</title>
    <group>MCP Servers</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-05</updated>
  </meta>

  <overview>
    User chỉnh sửa thông tin của một custom MCP server (name, description).
    Built-in server không thể chỉnh sửa.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click Edit trên một custom MCP server</action>
      <benefit>cập nhật tên hoặc mô tả của server</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút Edit trên mỗi custom MCP server card/row.</criterion>
    <criterion id="AC-02">Built-in server KHÔNG hiển thị nút Edit (trừ description).</criterion>
    <criterion id="AC-03">Dialog chỉnh sửa: Name (editable), Description (editable).</criterion>
    <criterion id="AC-04">Validation: Name unique, cùng rules như tạo mới.</criterion>
    <criterion id="AC-05">Save → danh sách cập nhật, toast thành công.</criterion>
    <criterion id="AC-06">API: PATCH /api/mcp-servers/:id → { name?, description? }.</criterion>
    <criterion id="AC-07">Nếu server không tồn tại → 400 not_found.</criterion>
    <criterion id="AC-08">Nếu là builtin → 403 forbidden (không cho sửa name).</criterion>
  </acceptance-criteria>
</feature>
