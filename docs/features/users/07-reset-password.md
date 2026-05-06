<feature>
  <meta>
    <id>user_reset_password</id>
    <title>Reset password</title>
    <group>Users</group>
    <status>planned</status>
    <priority>p1</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Admin reset password cho user bất kỳ. Password mới được tạo ngẫu nhiên
    hoặc do admin nhập, user sẽ cần dùng password mới để đăng nhập.
    User cũng có thể tự đổi password của mình.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Admin</actor>
      <action>reset password cho user quên mật khẩu</action>
      <benefit>user có thể đăng nhập lại mà không cần email recovery</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>đổi password của chính mình từ trang profile/settings</action>
      <benefit>bảo mật tài khoản cá nhân</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Admin: nút "Reset Password" trên mỗi user row/detail.</criterion>
    <criterion id="AC-02">Click → dialog nhập password mới (hoặc generate random).</criterion>
    <criterion id="AC-03">Password mới được hash và cập nhật vào DB.</criterion>
    <criterion id="AC-04">Mọi session cũ của user bị invalidate sau khi reset.</criterion>
    <criterion id="AC-05">Self-change: user nhập old password + new password + confirm.</criterion>
    <criterion id="AC-06">Validate: new password tối thiểu 8 ký tự, old password đúng.</criterion>
    <criterion id="AC-07">Toast thông báo thành công sau khi đổi password.</criterion>
  </acceptance-criteria>
</feature>
