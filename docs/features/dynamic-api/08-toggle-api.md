<feature>
  <meta>
    <id>dynamic_api_toggle</id>
    <title>Toggle active/inactive</title>
    <group>Dynamic API</group>
    <status>planned</status>
    <priority>p1</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User bật/tắt API endpoint mà không cần xoá. Endpoint inactive sẽ
    trả 404 khi gọi, nhưng code và config vẫn được giữ lại.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>toggle off API endpoint tạm thời</action>
      <benefit>tắt endpoint mà không mất code, có thể bật lại bất cứ lúc nào</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Toggle switch trên API row trong management page.</criterion>
    <criterion id="AC-02">Toggle off → isActive = false, request tới path trả 404.</criterion>
    <criterion id="AC-03">Toggle on → isActive = true, endpoint hoạt động lại ngay.</criterion>
    <criterion id="AC-04">Badge/icon hiển thị trạng thái active/inactive.</criterion>
    <criterion id="AC-05">API: PATCH /api/dynamic-apis/:id { isActive: boolean }.</criterion>
  </acceptance-criteria>
</feature>
