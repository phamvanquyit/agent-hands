<feature>
  <meta>
    <id>mcp_tool_logs</id>
    <title>Tool execution logs</title>
    <group>MCP Servers</group>
    <status>planned</status>
    <priority>p2</priority>
    <updated>2026-05-05</updated>
  </meta>

  <overview>
    Ghi log mỗi lần tool được thực thi: ai gọi, input params, output result,
    execution time, status (success/error). Log giúp debug và monitoring tools.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>mở tab Logs trên trang tool detail</action>
      <benefit>xem lịch sử thực thi, debug lỗi, monitoring performance</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Mỗi lần tool execute → ghi 1 log record vào DB.</criterion>
    <criterion id="AC-02">Log record chứa: id, toolId, serverId, callerType (mcp_agent | test_panel), callerInfo (agent name hoặc user), inputParams (JSON), outputResult (JSON), status (success | error), errorMessage, executionTimeMs, createdAt.</criterion>
    <criterion id="AC-03">Tab "Logs" trên trang tool detail: table với pagination.</criterion>
    <criterion id="AC-04">Mỗi log row hiển thị: timestamp, caller, status badge (success/error), execution time.</criterion>
    <criterion id="AC-05">Click log → expand hiển thị input/output JSON.</criterion>
    <criterion id="AC-06">Filter logs theo: status, date range.</criterion>
    <criterion id="AC-07">API: GET /api/mcp-servers/:serverId/tools/:toolId/logs?page=1&limit=50.</criterion>
    <criterion id="AC-08">Auto-cleanup: logs cũ hơn 30 ngày bị xoá tự động (configurable).</criterion>
    <criterion id="AC-09">DB schema: tool_execution_logs table.</criterion>
  </acceptance-criteria>
</feature>
