<feature>
  <meta>
    <id>table_column_management</id>
    <title>Quản lý cột (properties)</title>
    <group>Dynamic Table</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User thêm, sửa, xoá, sắp xếp lại các cột (properties) của bảng.
    Mỗi cột có tên, kiểu dữ liệu, và các tuỳ chọn (options cho select,
    format cho date...). Giống Notion property management.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "+" trên header bảng để thêm cột mới</action>
      <benefit>mở rộng cấu trúc dữ liệu theo nhu cầu</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>click vào column header → menu chỉnh sửa/xoá/đổi type</action>
      <benefit>tuỳ chỉnh cấu trúc bảng linh hoạt</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút "+" trên cột cuối cùng của header → menu chọn column type.</criterion>
    <criterion id="AC-02">Click column header → dropdown menu: Rename, Edit type, Duplicate, Delete.</criterion>
    <criterion id="AC-03">Thêm cột: chọn type → cột mới xuất hiện ngay trên table với tên mặc định.</criterion>
    <criterion id="AC-04">Rename: inline edit trên header.</criterion>
    <criterion id="AC-05">Delete cột: confirm dialog, xoá cột và dữ liệu tương ứng trên tất cả rows.</criterion>
    <criterion id="AC-06">Drag & drop để sắp xếp lại thứ tự cột.</criterion>
    <criterion id="AC-07">Cột "Title" không thể xoá (primary column).</criterion>
    <criterion id="AC-08">API: POST /api/databases/:dbId/tables/:id/columns, PATCH /api/databases/:dbId/tables/:id/columns/:colId, DELETE /api/databases/:dbId/tables/:id/columns/:colId.</criterion>
  </acceptance-criteria>
</feature>
