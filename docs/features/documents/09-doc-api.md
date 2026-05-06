<feature>
  <meta>
    <id>doc_api</id>
    <title>API CRUD cho documents</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    RESTful API đầy đủ cho CRUD operations trên documents, scoped theo project.
    API này được sử dụng bởi cả frontend UI và MCP tools (agents).
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Frontend / MCP Tool</actor>
      <action>gọi API để đọc/ghi documents trong project</action>
      <benefit>tương tác với Documents qua HTTP</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">GET /api/projects/:projectId/documents — list all documents trong project (tree structure, có option flat).</criterion>
    <criterion id="AC-02">POST /api/projects/:projectId/documents — create document (title, parentId?, icon?, content?).</criterion>
    <criterion id="AC-03">GET /api/projects/:projectId/documents/:id — get document detail với blocks content.</criterion>
    <criterion id="AC-04">PATCH /api/projects/:projectId/documents/:id — update title, icon, cover, blocks.</criterion>
    <criterion id="AC-05">DELETE /api/projects/:projectId/documents/:id — delete document + cascade children.</criterion>
    <criterion id="AC-06">GET /api/projects/:projectId/documents/search?q=keyword — full-text search trong project.</criterion>
    <criterion id="AC-07">PATCH /api/projects/:projectId/documents/:id/move — move document (đổi parentId, reorder).</criterion>
    <criterion id="AC-08">Tất cả endpoints yêu cầu authentication (JWT).</criterion>
    <criterion id="AC-09">Validate projectId tồn tại trước khi thao tác document.</criterion>
  </acceptance-criteria>
</feature>
