<feature>
  <meta>
    <id>mcp_toggle_tool</id>
    <title>Toggle tool active/inactive</title>
    <group>MCP Servers</group>
    <status>planned</status>
    <priority>p1</priority>
    <updated>2026-05-05</updated>
  </meta>

  <overview>
    User có thể bật/tắt (enable/disable) một tool mà không cần xoá.
    Tool inactive sẽ không được expose cho AI agents khi chúng list tools
    qua MCP protocol.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>toggle switch trên tool row</action>
      <benefit>tạm ẩn tool mà không mất code/config</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Toggle switch trên mỗi tool row trong danh sách tools.</criterion>
    <criterion id="AC-02">Toggle → gọi API cập nhật isActive → UI phản ánh ngay (optimistic update).</criterion>
    <criterion id="AC-03">Tool inactive → không xuất hiện trong MCP tools/list response.</criterion>
    <criterion id="AC-04">Tool inactive vẫn hiển thị trên UI với style mờ (dimmed) + badge "Inactive".</criterion>
    <criterion id="AC-05">API: PATCH /api/mcp-servers/:serverId/tools/:toolId → { isActive: boolean }.</criterion>
    <criterion id="AC-06">System tools (builtin) cũng có thể toggle — cho phép admin disable system tool nếu muốn.</criterion>
  </acceptance-criteria>
</feature>
