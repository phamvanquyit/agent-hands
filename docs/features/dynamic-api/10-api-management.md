<feature>
  <meta>
    <id>dynamic_api_management</id>
    <title>API management page</title>
    <group>Dynamic API</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Trang quản lý tổng quan tất cả dynamic API endpoints. Hiển thị danh
    sách APIs với method, path, status, thống kê gọi.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>mở trang API Management để quản lý tất cả endpoints</action>
      <benefit>nhìn tổng quan và quản lý mọi dynamic endpoints</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Trang hiển thị bảng: Name, Method (badge màu), Path, Status (Active/Inactive), Last Called, Created At.</criterion>
    <criterion id="AC-02">Search bar: tìm theo name hoặc path.</criterion>
    <criterion id="AC-03">Filter: theo method, status.</criterion>
    <criterion id="AC-04">Click row → navigate tới editor page.</criterion>
    <criterion id="AC-05">Toolbar: New API, Delete selected.</criterion>
    <criterion id="AC-06">Method badge color: GET=green, POST=blue, PUT=orange, PATCH=purple, DELETE=red.</criterion>
    <criterion id="AC-07">Quick actions trên row: Edit, Toggle, Delete, Copy URL.</criterion>
  </acceptance-criteria>
</feature>
