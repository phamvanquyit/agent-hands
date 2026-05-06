<feature>
  <meta>
    <id>mcp_delete_tool</id>
    <title>Xoá tool</title>
    <group>MCP Servers</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-05</updated>
  </meta>

  <overview>
    User xoá một tool khỏi custom MCP server. Tool bị xoá sẽ không còn
    available cho AI agents. System tools (built-in) không thể xoá.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click Delete trên một tool</action>
      <benefit>gỡ bỏ tool không còn cần thiết</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút Delete trên mỗi custom tool (icon hoặc dropdown menu).</criterion>
    <criterion id="AC-02">System tools KHÔNG có nút Delete.</criterion>
    <criterion id="AC-03">Click Delete → confirmation dialog.</criterion>
    <criterion id="AC-04">Confirm → xoá tool khỏi DB, cập nhật danh sách.</criterion>
    <criterion id="AC-05">Xoá tool đồng thời xoá sandbox cache (venv) liên quan nếu có.</criterion>
    <criterion id="AC-06">API: DELETE /api/mcp-servers/:serverId/tools/:toolId.</criterion>
    <criterion id="AC-07">Nếu là system tool → 403 forbidden.</criterion>
    <criterion id="AC-08">Nếu tool không tồn tại → 400 not_found.</criterion>
  </acceptance-criteria>
</feature>
