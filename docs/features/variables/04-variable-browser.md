<feature>
  <meta>
    <id>variable_browser</id>
    <title>Variable browser UI</title>
    <group>Dynamic Variables</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Giao diện quản lý variables theo 2 cấp: trang danh sách namespaces
    và trang chi tiết variables trong mỗi namespace. Hỗ trợ search,
    hiển thị key, value (truncated), type, TTL remaining, timestamps.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>mở trang Variables để browse và quản lý key-value pairs</action>
      <benefit>nhìn tổng quan tất cả variables trong hệ thống</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Trang /variables hiển thị danh sách namespaces: Name, Description, Icon, số lượng variables, Updated At. Nút "Add Namespace".</criterion>
    <criterion id="AC-02">Click namespace → điều hướng tới /variables/namespace/:namespaceId → trang chi tiết hiển thị bảng variables.</criterion>
    <criterion id="AC-03">Trang variables trong namespace: bảng Key, Value (truncated 100 chars), Type, TTL, Updated At.</criterion>
    <criterion id="AC-04">Search bar: tìm theo key (debounce 300ms).</criterion>
    <criterion id="AC-05">Sort theo: key, type, updated_at, TTL.</criterion>
    <criterion id="AC-06">Click row → expand hiển thị full value (JSON formatted nếu type=json).</criterion>
    <criterion id="AC-07">Toolbar: Add Variable, Delete selected, Flush namespace.</criterion>
    <criterion id="AC-08">Badge hiển thị TTL remaining (countdown hoặc "No expiry").</criterion>
    <criterion id="AC-09">Variables đã hết TTL hiển thị strikethrough hoặc tự động ẩn.</criterion>
  </acceptance-criteria>
</feature>
