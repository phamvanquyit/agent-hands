<feature>
  <meta>
    <id>user_create</id>
    <title>Thêm user mới</title>
    <group>Users</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Super admin hoặc admin tạo tài khoản user mới trong hệ thống.
    User mới được gán role và nhận thông tin đăng nhập.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Admin</actor>
      <action>click "Add User" trên trang User Management</action>
      <benefit>thêm thành viên mới vào hệ thống</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút "Add User" chỉ hiển thị cho user có role admin/superadmin.</criterion>
    <criterion id="AC-02">Click → dialog tạo user mở ra với các trường: Username (bắt buộc), Email (bắt buộc), Password (bắt buộc, tối thiểu 8 ký tự), Name (bắt buộc), Role (dropdown: admin/member).</criterion>
    <criterion id="AC-03">Username và email phải unique, server validate và trả lỗi nếu trùng.</criterion>
    <criterion id="AC-04">Password được hash trước khi lưu DB.</criterion>
    <criterion id="AC-05">Nhấn Save → user mới xuất hiện trong danh sách users.</criterion>
    <criterion id="AC-06">Nhấn Cancel → đóng dialog, không có thay đổi.</criterion>
    <criterion id="AC-07">Toast thông báo "User [username] đã được tạo" sau khi thành công.</criterion>
  </acceptance-criteria>
</feature>
