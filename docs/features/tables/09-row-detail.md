<feature>
  <meta>
    <id>table_row_detail</id>
    <title>Row detail dialog</title>
    <group>Dynamic Table</group>
    <status>planned</status>
    <priority>p1</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Khi click "Open" trên một row, dialog detail mở ra hiển thị tất cả
    properties của row đó dạng form. Giống Notion page view cho một
    database record.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click vào row title hoặc "Open" từ context menu</action>
      <benefit>xem và chỉnh sửa đầy đủ tất cả fields của record</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Click row title hoặc "Open" → dialog/drawer mở ra.</criterion>
    <criterion id="AC-02">Hiển thị tất cả properties dạng form (label: value), theo đúng column type.</criterion>
    <criterion id="AC-03">Chỉnh sửa inline trên dialog, auto-save khi blur.</criterion>
    <criterion id="AC-04">Nút Delete row trên dialog.</criterion>
    <criterion id="AC-05">Nút đóng (X) hoặc click outside → đóng dialog.</criterion>
  </acceptance-criteria>
</feature>
