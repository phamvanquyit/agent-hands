<feature>
  <meta>
    <id>user_session_management</id>
    <title>Session management</title>
    <group>Users</group>
    <status>planned</status>
    <priority>p2</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Quản lý phiên đăng nhập: JWT token với refresh mechanism, auto-logout
    khi hết hạn, và WebSocket authentication.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>đăng nhập và làm việc liên tục</action>
      <benefit>không bị logout đột ngột nhờ token refresh tự động</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">JWT access token có TTL 1h, refresh token có TTL 7d.</criterion>
    <criterion id="AC-02">Client tự động gọi refresh endpoint khi access token sắp hết hạn.</criterion>
    <criterion id="AC-03">Refresh token xoay (rotate) mỗi lần sử dụng.</criterion>
    <criterion id="AC-04">WebSocket connection gửi token khi handshake, server validate.</criterion>
    <criterion id="AC-05">Khi admin xoá user hoặc reset password → tất cả token bị revoke.</criterion>
    <criterion id="AC-06">Hết hạn cả access + refresh → redirect về trang login.</criterion>
  </acceptance-criteria>
</feature>
