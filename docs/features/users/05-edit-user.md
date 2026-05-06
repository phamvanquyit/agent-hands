<feature>
  <meta>
    <id>user_edit</id>
    <title>Chỉnh sửa user</title>
    <group>Users</group>
    <status>planned</status>
    <priority>p1</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Admin chỉnh sửa thông tin user: username, email, role.
    Super admin không thể bị hạ quyền bởi admin thường.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Admin</actor>
      <action>click vào user trong danh sách → chỉnh sửa thông tin</action>
      <benefit>cập nhật thông tin hoặc thay đổi quyền của user</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Click vào user → dialog chỉnh sửa mở ra với dữ liệu đã điền sẵn.</criterion>
    <criterion id="AC-02">Các trường có thể chỉnh sửa: Username, Email, Role.</criterion>
    <criterion id="AC-03">Không thể chỉnh sửa role của super admin (field disabled).</criterion>
    <criterion id="AC-04">Username và email validate unique (trừ chính user đó).</criterion>
    <criterion id="AC-05">Nhấn Save → thông tin user được cập nhật ngay trong danh sách.</criterion>
    <criterion id="AC-06">Nhấn Cancel → đóng dialog, không có thay đổi.</criterion>
  </acceptance-criteria>
</feature>
