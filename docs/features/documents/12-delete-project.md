<feature>
  <meta>
    <id>project_delete</id>
    <title>Xoá project</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    User xoá project. Tất cả documents bên trong project sẽ bị xoá theo
    (cascade delete). Hành động không thể hoàn tác.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>xoá project không còn cần thiết</action>
      <benefit>dọn dẹp workspace, giải phóng tài nguyên</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Right-click project trong sidebar → "Delete" option.</criterion>
    <criterion id="AC-02">Click Delete → dialog xác nhận "Xoá project [name]? Tất cả documents bên trong sẽ bị xoá."</criterion>
    <criterion id="AC-03">Dialog hiển thị số lượng documents sẽ bị xoá.</criterion>
    <criterion id="AC-04">Xác nhận → project và tất cả documents biến mất khỏi sidebar.</criterion>
    <criterion id="AC-05">Nếu đang ở trong project bị xoá → navigate về trang project list.</criterion>
    <criterion id="AC-06">Huỷ → không thay đổi gì.</criterion>
    <criterion id="AC-07">API: DELETE /api/projects/:id → cascade delete tất cả documents.</criterion>
  </acceptance-criteria>
</feature>
