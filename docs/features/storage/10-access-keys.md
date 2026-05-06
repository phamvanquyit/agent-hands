<feature>
  <meta>
    <id>file_access_keys</id>
    <title>Access keys management</title>
    <group>Storage</group>
    <status>done</status>
    <priority>p1</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Quản lý access key + secret key để client bên ngoài xác thực khi kết
    nối qua S3 API. Giống MinIO access keys: mỗi key pair có quyền riêng,
    có thể tạo nhiều key pairs cho các ứng dụng khác nhau.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Admin</actor>
      <action>tạo access key pair cho ứng dụng external</action>
      <benefit>ứng dụng bên ngoài kết nối an toàn vào storage, mỗi app có key riêng</benefit>
    </story>
    <story id="US-02">
      <actor>Admin</actor>
      <action>revoke (xoá) access key không còn dùng</action>
      <benefit>thu hồi quyền truy cập khi không cần nữa</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Trang Access Keys trong Settings: danh sách tất cả key pairs.</criterion>
    <criterion id="AC-02">Tạo key pair: generate accessKey (20 chars) + secretKey (40 chars), hiển thị secretKey 1 lần duy nhất.</criterion>
    <criterion id="AC-03">Mỗi key pair có label/description để phân biệt.</criterion>
    <criterion id="AC-04">Enable/Disable key pair (tạm tắt mà không xoá).</criterion>
    <criterion id="AC-05">Xoá key pair: confirm, client dùng key đó sẽ bị từ chối ngay.</criterion>
    <criterion id="AC-06">Root access key: tạo từ env vars STORAGE_ACCESS_KEY + STORAGE_SECRET_KEY (mặc định khi setup).</criterion>
    <criterion id="AC-07">S3 API validate: parse Authorization header → tìm accessKey → verify signature bằng secretKey.</criterion>
    <criterion id="AC-08">DB table `access_keys`: id, accessKey, secretKeyHash, label, isActive, createdAt.</criterion>
  </acceptance-criteria>
</feature>
