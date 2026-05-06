<feature>
  <meta>
    <id>mcp_connection_endpoint</id>
    <title>MCP server connection endpoint</title>
    <group>MCP Servers</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-05</updated>
  </meta>

  <overview>
    Mỗi MCP server (builtin + custom) có một HTTP endpoint hỗ trợ MCP
    protocol. AI agents kết nối tới endpoint này qua SSE (Server-Sent Events)
    transport để discover và gọi tools. Endpoint yêu cầu authentication
    (API key hoặc JWT).
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>AI Agent</actor>
      <action>kết nối tới MCP endpoint URL</action>
      <benefit>discover available tools và gọi chúng theo MCP protocol chuẩn</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>copy MCP endpoint URL từ UI</action>
      <benefit>cấu hình AI agent để kết nối tới server</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Endpoint URL format: /api/mcp/:serverId/sse (SSE transport).</criterion>
    <criterion id="AC-02">Hỗ trợ MCP protocol qua SSE transport (Server-Sent Events).</criterion>
    <criterion id="AC-03">Authentication: Bearer token (JWT) hoặc API key qua header x-api-key.</criterion>
    <criterion id="AC-04">Khi AI agent kết nối → trả về danh sách tools available trong server đó.</criterion>
    <criterion id="AC-05">Khi AI agent gọi tool → execute tool và stream kết quả.</criterion>
    <criterion id="AC-06">Nếu server isActive = false → reject connection, trả lỗi.</criterion>
    <criterion id="AC-07">UI hiển thị endpoint URL dạng copyable input trên server detail page.</criterion>
    <criterion id="AC-08">Hỗ trợ Streamable HTTP transport (mới hơn SSE, theo MCP spec mới).</criterion>
  </acceptance-criteria>
</feature>
