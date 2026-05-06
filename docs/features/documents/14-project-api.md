<feature>
  <meta>
    <id>project_api</id>
    <title>API CRUD cho projects</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    RESTful API đầy đủ cho CRUD operations trên projects. API này được
    sử dụng bởi cả frontend UI và MCP tools (agents).
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Frontend / MCP Tool</actor>
      <action>gọi API để quản lý projects</action>
      <benefit>tương tác với Projects qua HTTP</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">GET /api/projects — list all projects (response: { items, meta }).</criterion>
    <criterion id="AC-02">POST /api/projects — create project (name required, description?).</criterion>
    <criterion id="AC-03">GET /api/projects/:id — get project detail (kèm document count).</criterion>
    <criterion id="AC-04">PATCH /api/projects/:id — update name, description.</criterion>
    <criterion id="AC-05">DELETE /api/projects/:id — delete project + cascade delete all documents.</criterion>
    <criterion id="AC-06">Tất cả endpoints yêu cầu authentication (JWT).</criterion>
    <criterion id="AC-07">Response format: single → trả thẳng object, list → { items: [], meta: { total } }.</criterion>
  </acceptance-criteria>
</feature>
