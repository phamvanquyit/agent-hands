<feature>
  <meta>
    <id>dynamic_api_edit</id>
    <title>Chỉnh sửa API endpoint</title>
    <group>Dynamic API</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User chỉnh sửa thông tin và code của API endpoint. Thay đổi có hiệu lực
    ngay lập tức (hot-reload), không cần restart.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click vào API endpoint → chỉnh sửa code hoặc metadata</action>
      <benefit>cập nhật logic xử lý API tại runtime</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Click API row → mở editor page/dialog.</criterion>
    <criterion id="AC-02">Chỉnh sửa được: Name, Method, Path, Description, Code.</criterion>
    <criterion id="AC-03">Code editor (Monaco) với Python syntax highlight, autocomplete.</criterion>
    <criterion id="AC-04">Save (Ctrl+S) → code cập nhật trong DB, có hiệu lực ngay request tiếp theo.</criterion>
    <criterion id="AC-05">Dirty check: cảnh báo nếu rời trang khi có thay đổi chưa save.</criterion>
    <criterion id="AC-06">API: PATCH /api/dynamic-apis/:id.</criterion>
  </acceptance-criteria>
</feature>
