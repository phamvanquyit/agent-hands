<feature>
  <meta>
    <id>doc_nested</id>
    <title>Nested documents (sub-pages)</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p1</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    Documents có thể chứa sub-pages (children documents), tạo thành cây
    phân cấp nhiều level bên trong cùng một project. Giống Notion page-inside-page.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>tạo sub-page bên trong một document</action>
      <benefit>tổ chức nội dung theo cấu trúc phân cấp logic</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Mỗi document có trường parentId (nullable) → tạo cây phân cấp trong project.</criterion>
    <criterion id="AC-02">Nút "+" trên document hover → tạo child page.</criterion>
    <criterion id="AC-03">Sidebar tree indent đúng theo level.</criterion>
    <criterion id="AC-04">Breadcrumb ở đầu editor hiển thị path: Project > Parent > Current.</criterion>
    <criterion id="AC-05">Move document: drag-drop trong sidebar để đổi parent.</criterion>
    <criterion id="AC-06">Xoá parent → cascade delete tất cả children.</criterion>
    <criterion id="AC-07">Sub-pages luôn thuộc cùng project với parent document.</criterion>
  </acceptance-criteria>
</feature>
