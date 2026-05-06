<feature>
  <meta>
    <id>mcp_delete_server</id>
    <title>Xoá MCP server</title>
    <group>MCP Servers</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-05</updated>
  </meta>

  <overview>
    User xoá một custom MCP server. Tất cả tools thuộc server đó cũng bị xoá
    theo (cascade). Built-in server không thể xoá.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click Delete trên một custom MCP server</action>
      <benefit>gỡ bỏ server và tất cả tools không còn cần thiết</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút Delete trên mỗi custom MCP server card/row.</criterion>
    <criterion id="AC-02">Built-in server KHÔNG hiển thị nút Delete.</criterion>
    <criterion id="AC-03">Click Delete → confirmation dialog: "Xoá server [name] sẽ xoá tất cả [N] tools thuộc server này. Hành động này không thể hoàn tác."</criterion>
    <criterion id="AC-04">Confirm → xoá server + cascade xoá tất cả tools thuộc server.</criterion>
    <criterion id="AC-05">Xoá xong → redirect về trang MCP Management, toast thành công.</criterion>
    <criterion id="AC-06">API: DELETE /api/mcp-servers/:id.</criterion>
    <criterion id="AC-07">Nếu là builtin → 403 forbidden.</criterion>
    <criterion id="AC-08">Nếu server không tồn tại → 400 not_found.</criterion>
  </acceptance-criteria>
</feature>
