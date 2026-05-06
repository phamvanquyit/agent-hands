<feature>
  <meta>
    <id>doc_delete</id>
    <title>Xoá document</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    User xoá document. Nếu document có sub-pages, tất cả sub-pages
    cũng bị xoá theo (cascade). Hành động không thể hoàn tác.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>xoá document không còn cần thiết</action>
      <benefit>dọn dẹp project</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Right-click document trong sidebar → "Delete" option.</criterion>
    <criterion id="AC-02">Click Delete → dialog xác nhận "Xoá [title]? Các sub-pages cũng sẽ bị xoá."</criterion>
    <criterion id="AC-03">Xác nhận → document và sub-pages biến mất khỏi sidebar tree.</criterion>
    <criterion id="AC-04">Nếu document đang mở → chuyển về trang trống hoặc doc khác.</criterion>
    <criterion id="AC-05">Huỷ → không thay đổi gì.</criterion>
    <criterion id="AC-06">API: DELETE /api/projects/:projectId/documents/:id → cascade delete children.</criterion>
  </acceptance-criteria>
</feature>
