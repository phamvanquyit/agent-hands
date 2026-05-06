<feature>
  <meta>
    <id>user_super_admin_init</id>
    <title>Super admin init (migration)</title>
    <group>Users</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Khi cài đặt ứng dụng lần đầu, hệ thống tự động tạo một tài khoản
    super admin thông qua database migration. Super admin có toàn quyền
    quản trị hệ thống, bao gồm quản lý users, cấu hình, và mọi
    tính năng khác. Thông tin đăng nhập mặc định được in ra console
    khi chạy migration.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>System</actor>
      <action>chạy migration lần đầu khi cài đặt app</action>
      <benefit>tạo super admin account sẵn sàng để quản trị, không cần setup thủ công</benefit>
    </story>
    <story id="US-02">
      <actor>Admin</actor>
      <action>đọc thông tin đăng nhập mặc định từ console output</action>
      <benefit>đăng nhập ngay sau khi cài đặt xong</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Migration tạo bảng `users` với các cột: id, username, email, password_hash, role, created_at, updated_at.</criterion>
    <criterion id="AC-02">Migration seed một record super admin với username `admin` và password ngẫu nhiên (hoặc từ env var `ADMIN_PASSWORD`).</criterion>
    <criterion id="AC-03">Password được hash bằng bcrypt/argon2 trước khi lưu DB.</criterion>
    <criterion id="AC-04">Console in ra username và password mặc định sau khi migration thành công.</criterion>
    <criterion id="AC-05">Nếu super admin đã tồn tại, migration không tạo trùng.</criterion>
    <criterion id="AC-06">Role của super admin là `superadmin`, không thể bị xoá hoặc hạ quyền.</criterion>
  </acceptance-criteria>
</feature>
