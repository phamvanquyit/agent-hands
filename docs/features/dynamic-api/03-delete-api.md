<feature>
  <meta>
    <id>dynamic_api_delete</id>
    <title>Xoá API endpoint</title>
    <group>Dynamic API</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User xoá API endpoint. Endpoint ngừng hoạt động ngay, mọi request
    tới path đó trả 404.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>xoá API endpoint không còn cần</action>
      <benefit>gỡ bỏ endpoint khỏi hệ thống</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút "Delete" trên API row hoặc editor page.</criterion>
    <criterion id="AC-02">Click → dialog xác nhận "Xoá API [name]?".</criterion>
    <criterion id="AC-03">Xác nhận → xoá khỏi DB, path trả 404 ngay.</criterion>
    <criterion id="AC-04">Huỷ → không thay đổi.</criterion>
    <criterion id="AC-05">Toast "Đã xoá API [name]" sau khi thành công.</criterion>
    <criterion id="AC-06">API: DELETE /api/dynamic-apis/:id.</criterion>
  </acceptance-criteria>
</feature>
