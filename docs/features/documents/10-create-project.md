<feature>
  <meta>
    <id>project_create</id>
    <title>Tạo project mới</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    User tạo một project mới. Project là container cho Documents. Mỗi project
    có name (required) và description (optional). Sau khi tạo, user có thể
    bắt đầu tạo documents bên trong project.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "New Project" trên sidebar hoặc trang project list</action>
      <benefit>tạo workspace mới để tổ chức documents</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút "New Project" trên sidebar (phần Projects) và trên trang project list.</criterion>
    <criterion id="AC-02">Click → dialog/form nhập: name (required), description (optional).</criterion>
    <criterion id="AC-03">Submit → project mới xuất hiện trong sidebar và project list.</criterion>
    <criterion id="AC-04">Sau tạo → tự động navigate vào project (hiển thị trang trống "No documents yet").</criterion>
    <criterion id="AC-05">API: POST /api/projects → trả về project object với id, name, description.</criterion>
  </acceptance-criteria>
</feature>
