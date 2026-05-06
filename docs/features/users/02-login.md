<feature>
  <meta>
    <id>user_login</id>
    <title>Đăng nhập (Login)</title>
    <group>Users</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User đăng nhập vào hệ thống bằng username/email và password.
    Sau khi đăng nhập thành công, hệ thống cấp JWT token (hoặc session)
    để xác thực các request tiếp theo. Mọi route (trừ public routes)
    đều yêu cầu đăng nhập.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>nhập username/email và password, nhấn Login</action>
      <benefit>truy cập hệ thống và sử dụng các tính năng</benefit>
    </story>
    <story id="US-02">
      <actor>User chưa đăng nhập</actor>
      <action>truy cập bất kỳ trang nào</action>
      <benefit>tự động redirect về trang login</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Trang login hiển thị form với 2 trường: Username/Email và Password.</criterion>
    <criterion id="AC-02">Nhấn Login → validate input, gọi API POST /api/auth/login.</criterion>
    <criterion id="AC-03">Đăng nhập thành công → trả về JWT token, lưu vào httpOnly cookie hoặc localStorage.</criterion>
    <criterion id="AC-04">Đăng nhập thất bại → hiển thị thông báo lỗi cụ thể (sai password, user không tồn tại).</criterion>
    <criterion id="AC-05">Sau đăng nhập thành công → redirect về trang chính (canvas).</criterion>
    <criterion id="AC-06">Token có thời hạn (mặc định 24h), hết hạn → redirect về login.</criterion>
    <criterion id="AC-07">Tất cả API routes (trừ /api/auth/*) yêu cầu token hợp lệ, trả 401 nếu thiếu/hết hạn.</criterion>
  </acceptance-criteria>
</feature>
