<feature>
  <meta>
    <id>table_create</id>
    <title>Tạo bảng mới</title>
    <group>Dynamic Table</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User tạo một bảng (database) mới. Mỗi bảng có tên, mô tả, và tập hợp
    cột (properties) tuỳ chỉnh. Bảng mới tạo có sẵn một cột "Title" mặc định.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "New Table" trên trang Tables</action>
      <benefit>tạo database tuỳ chỉnh để lưu trữ và quản lý dữ liệu có cấu trúc</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút "New Table" hiển thị trên trang danh sách tables.</criterion>
    <criterion id="AC-02">Click → dialog tạo bảng với các trường: Tên (bắt buộc), Mô tả (optional), Icon (emoji picker).</criterion>
    <criterion id="AC-03">Nhấn Save → bảng mới xuất hiện trong danh sách, tự động có cột "Title" (type: text, bắt buộc).</criterion>
    <criterion id="AC-04">Nhấn Cancel → đóng dialog, không tạo gì.</criterion>
    <criterion id="AC-05">Tên bảng phải unique trong workspace.</criterion>
    <criterion id="AC-06">API: POST /api/databases/:dbId/tables → trả về table object với id, name, columns[]. Bảng mới tự động có cột "Title" (type: text).</criterion>
  </acceptance-criteria>
</feature>
