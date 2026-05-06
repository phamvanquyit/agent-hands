<feature>
  <meta>
    <id>user_logout</id>
    <title>Đăng xuất (Logout)</title>
    <group>Users</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User đăng xuất khỏi hệ thống. Token/session bị xoá, user quay về
    trang login.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click nút Logout trên navigation/header</action>
      <benefit>thoát phiên làm việc an toàn, bảo vệ tài khoản</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút Logout hiển thị trên header/user menu khi đã đăng nhập.</criterion>
    <criterion id="AC-02">Click Logout → xoá token/cookie khỏi client.</criterion>
    <criterion id="AC-03">Server invalidate session/token (nếu dùng token blacklist).</criterion>
    <criterion id="AC-04">Redirect về trang login sau khi logout.</criterion>
    <criterion id="AC-05">Sau logout, truy cập route yêu cầu auth → redirect về login.</criterion>
  </acceptance-criteria>
</feature>
