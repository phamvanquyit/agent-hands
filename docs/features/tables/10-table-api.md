<feature>
  <meta>
    <id>table_api</id>
    <title>API CRUD cho table data</title>
    <group>Dynamic Table</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    RESTful API đầy đủ cho CRUD operations trên databases, tables, columns, và rows.
    Databases là entity cấp cao nhất, tables là nested resource.
    API này được sử dụng bởi cả frontend UI và MCP tools (agents).

    Base URL databases: /api/databases
    Base URL tables: /api/databases/:dbId/tables
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Frontend / MCP Tool</actor>
      <action>gọi API để đọc/ghi dữ liệu bảng</action>
      <benefit>tương tác với Dynamic Table qua HTTP</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Databases: GET /api/databases (list), POST /api/databases (create), GET /api/databases/:id, PATCH /api/databases/:id, DELETE /api/databases/:id.</criterion>
    <criterion id="AC-02">Tables: GET /api/databases/:dbId/tables (list), POST /api/databases/:dbId/tables (create), GET /api/databases/:dbId/tables/:id, PATCH /api/databases/:dbId/tables/:id, DELETE /api/databases/:dbId/tables/:id.</criterion>
    <criterion id="AC-03">Columns: GET /api/databases/:dbId/tables/:id/columns, POST /api/databases/:dbId/tables/:id/columns, PATCH /api/databases/:dbId/tables/:id/columns/:colId, DELETE /api/databases/:dbId/tables/:id/columns/:colId.</criterion>
    <criterion id="AC-04">Rows: GET /api/databases/:dbId/tables/:id/rows (list, support pagination + sort + filter), POST /api/databases/:dbId/tables/:id/rows, PATCH /api/databases/:dbId/tables/:id/rows/:rowId, DELETE /api/databases/:dbId/tables/:id/rows/:rowId.</criterion>
    <criterion id="AC-05">Bulk operations: POST /api/databases/:dbId/tables/:id/rows/bulk-delete, POST /api/databases/:dbId/tables/:id/rows/bulk-update.</criterion>
    <criterion id="AC-06">Response format chuẩn: { items, meta: { total, page, limit, hasMore } }.</criterion>
    <criterion id="AC-07">Tất cả endpoints yêu cầu authentication (JWT hoặc API key).</criterion>
  </acceptance-criteria>
</feature>
