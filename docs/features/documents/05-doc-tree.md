<feature>
  <meta>
    <id>doc_tree</id>
    <title>Document tree (sidebar)</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    Sidebar hiển thị cây thư mục documents của project hiện tại. Hỗ trợ
    expand/collapse, drag-drop để di chuyển, nested levels. Giống sidebar
    navigation của Notion. Document tree chỉ hiển thị khi user đang ở
    trong context của một project.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>browse qua cây document ở sidebar (trong project)</action>
      <benefit>nhanh chóng navigate đến document cần thiết</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Sidebar hiển thị danh sách documents dạng tree (indent cho sub-pages) — scoped theo project hiện tại.</criterion>
    <criterion id="AC-02">Click arrow icon → expand/collapse children.</criterion>
    <criterion id="AC-03">Click document name → mở document đó trên editor.</criterion>
    <criterion id="AC-04">Drag-drop document → di chuyển vị trí (reorder hoặc nest under khác).</criterion>
    <criterion id="AC-05">Hover row → hiện icon "+" (thêm sub-page), "..." (menu: Rename, Delete, Duplicate).</criterion>
    <criterion id="AC-06">Document đang mở được highlight trong sidebar.</criterion>
    <criterion id="AC-07">Header sidebar hiển thị tên project hiện tại.</criterion>
  </acceptance-criteria>
</feature>
