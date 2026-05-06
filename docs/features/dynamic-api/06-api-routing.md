<feature>
  <meta>
    <id>dynamic_api_routing</id>
    <title>API request routing</title>
    <group>Dynamic API</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Router catch-all cho prefix /api/dynamic/* → match với dynamic API
    endpoints đã đăng ký. Hỗ trợ path params, method matching,
    và fallback 404.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>External client</actor>
      <action>gọi GET /api/dynamic/my-endpoint</action>
      <benefit>request được route tới Python handler tương ứng</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Mọi request /api/dynamic/* được catch bởi dynamic router.</criterion>
    <criterion id="AC-02">Router match theo: method + path pattern (exact match hoặc param match).</criterion>
    <criterion id="AC-03">Path params: /users/:id → request.params = { id: "123" }.</criterion>
    <criterion id="AC-04">Chỉ route tới endpoints có isActive = true.</criterion>
    <criterion id="AC-05">Không match → trả 404 { error: "Endpoint not found" }.</criterion>
    <criterion id="AC-06">Method không match (path match nhưng method khác) → trả 405 Method Not Allowed.</criterion>
    <criterion id="AC-07">Route table cached in memory, invalidate khi CRUD dynamic-apis.</criterion>
    <criterion id="AC-08">Tuỳ chọn auth: mỗi API endpoint có thể cấu hình yêu cầu JWT hoặc public.</criterion>
  </acceptance-criteria>
</feature>
