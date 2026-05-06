<feature>
  <meta>
    <id>variable_api</id>
    <title>API CRUD cho variables</title>
    <group>Dynamic Variables</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    RESTful API đầy đủ cho CRUD operations trên variable namespaces và variables.
    Namespaces là entity cấp cao nhất, variables là nested resource.
    API này được sử dụng bởi cả frontend UI, MCP tools, và Dynamic APIs.

    Base URL namespaces: /api/variable-namespaces
    Base URL variables: /api/variable-namespaces/:namespaceId/variables
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Frontend / MCP Tool / Dynamic API</actor>
      <action>gọi API để đọc/ghi variables</action>
      <benefit>tương tác với key-value store qua HTTP</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Namespace CRUD: GET /api/variable-namespaces (list), POST /api/variable-namespaces (create), GET /api/variable-namespaces/:namespaceId, PATCH /api/variable-namespaces/:namespaceId, DELETE /api/variable-namespaces/:namespaceId.</criterion>
    <criterion id="AC-02">GET /api/variable-namespaces/:namespaceId/variables — list variables (query: search, sort, order, page, limit). Tự động lọc expired.</criterion>
    <criterion id="AC-03">GET /api/variable-namespaces/:namespaceId/variables/by-key/:key — get variable by key (trả 404 nếu expired).</criterion>
    <criterion id="AC-04">GET /api/variable-namespaces/:namespaceId/variables/:id — get variable by ID.</criterion>
    <criterion id="AC-05">POST /api/variable-namespaces/:namespaceId/variables — create/upsert variable { key, value, type?, ttl? }.</criterion>
    <criterion id="AC-06">POST /api/variable-namespaces/:namespaceId/variables/bulk — batch create/upsert nhiều variables { variables: [...] }.</criterion>
    <criterion id="AC-07">PATCH /api/variable-namespaces/:namespaceId/variables/:id — update variable { value?, type?, ttl? }.</criterion>
    <criterion id="AC-08">DELETE /api/variable-namespaces/:namespaceId/variables/:id — delete single variable.</criterion>
    <criterion id="AC-09">DELETE /api/variable-namespaces/:namespaceId/variables — flush all variables in namespace.</criterion>
    <criterion id="AC-10">Tất cả endpoints yêu cầu authentication (JWT hoặc API key).</criterion>
  </acceptance-criteria>
</feature>
