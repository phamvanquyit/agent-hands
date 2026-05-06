<feature>
  <meta>
    <id>table_row_crud</id>
    <title>Thêm/sửa/xoá rows</title>
    <group>Dynamic Table</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User thao tác CRUD trên rows (records) của bảng. Thêm row mới bằng
    nút "+" hoặc nhấn Enter ở row cuối. Sửa inline trực tiếp trên cell.
    Xoá qua context menu hoặc multi-select.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "New" hoặc nhấn nút "+" ở cuối bảng</action>
      <benefit>thêm record mới nhanh chóng</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>click vào cell và nhập dữ liệu trực tiếp</action>
      <benefit>sửa dữ liệu inline không cần mở dialog</benefit>
    </story>
    <story id="US-03">
      <actor>User</actor>
      <action>chọn nhiều rows → bulk delete</action>
      <benefit>xoá hàng loạt nhanh chóng</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút "New" hoặc row "+" ở cuối bảng → thêm row trống mới.</criterion>
    <criterion id="AC-02">Click cell → inline edit mode, tự động save khi blur hoặc Enter.</criterion>
    <criterion id="AC-03">Right-click row → context menu: Open, Duplicate, Delete.</criterion>
    <criterion id="AC-04">Checkbox column đầu tiên cho multi-select → nút "Delete selected" xuất hiện.</criterion>
    <criterion id="AC-05">Dữ liệu row lưu dạng JSON flexible: { columnId: value, ... }.</criterion>
    <criterion id="AC-06">API: POST /api/databases/:dbId/tables/:id/rows, PATCH /api/databases/:dbId/tables/:id/rows/:rowId, DELETE /api/databases/:dbId/tables/:id/rows/:rowId.</criterion>
    <criterion id="AC-07">Hỗ trợ pagination: mặc định load 50 rows, scroll thêm để load tiếp.</criterion>
  </acceptance-criteria>
</feature>
