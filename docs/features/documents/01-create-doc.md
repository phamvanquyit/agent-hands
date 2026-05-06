<feature>
  <meta>
    <id>doc_create</id>
    <title>Tạo document mới</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    User tạo một document mới bên trong project hiện tại. Document có thể là
    root-level hoặc sub-page của document khác. Mới tạo sẽ có một block trống
    sẵn sàng cho nhập liệu.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "New Page" trên sidebar hoặc nút "+" trong doc tree (trong context của project)</action>
      <benefit>tạo tài liệu mới nhanh chóng trong project</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">User phải đang ở trong một project để tạo document.</criterion>
    <criterion id="AC-02">Nút "New Page" trên sidebar doc tree (bên trong project).</criterion>
    <criterion id="AC-03">Click → document mới được tạo với title "Untitled", mở ngay editor.</criterion>
    <criterion id="AC-04">Document mới có một empty paragraph block sẵn.</criterion>
    <criterion id="AC-05">Document tự động thuộc project hiện tại (projectId).</criterion>
    <criterion id="AC-06">Nếu click "+" trên một document → tạo sub-page (child).</criterion>
    <criterion id="AC-07">Document xuất hiện ngay trong sidebar tree.</criterion>
    <criterion id="AC-08">API: POST /api/projects/:projectId/documents → trả về doc object với id, projectId, title, parentId, blocks[].</criterion>
  </acceptance-criteria>
</feature>
