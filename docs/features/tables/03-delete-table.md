<feature>
  <meta>
    <id>table_delete</id>
    <title>Xoá bảng</title>
    <group>Dynamic Table</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User xoá một bảng và toàn bộ dữ liệu (rows) bên trong. Hành động
    không thể hoàn tác.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>xoá bảng không còn sử dụng</action>
      <benefit>dọn dẹp workspace, giải phóng dữ liệu không cần thiết</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút "Delete" trên bảng row hoặc context menu.</criterion>
    <criterion id="AC-02">Click Delete → dialog xác nhận "Xoá bảng [tên]? Tất cả [N] rows sẽ bị xoá."</criterion>
    <criterion id="AC-03">Xác nhận → bảng và toàn bộ rows bị xoá khỏi DB.</criterion>
    <criterion id="AC-04">Huỷ → không thay đổi gì.</criterion>
    <criterion id="AC-05">Toast "Đã xoá bảng [tên]" sau khi thành công.</criterion>
    <criterion id="AC-06">API: DELETE /api/databases/:dbId/tables/:id → cascade delete rows.</criterion>
  </acceptance-criteria>
</feature>
