<feature>
  <meta>
    <id>file_bucket_management</id>
    <title>Bucket management</title>
    <group>Storage</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Buckets là container cấp cao nhất cho objects, giống S3 buckets.
    User tạo, xoá, cấu hình bucket (public/private) qua UI hoặc
    S3-compatible API.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>tạo bucket mới để tổ chức files</action>
      <benefit>phân nhóm objects theo mục đích (ví dụ: avatars, documents, exports)</benefit>
    </story>
    <story id="US-02">
      <actor>External client (S3 SDK)</actor>
      <action>gọi CreateBucket / ListBuckets / DeleteBucket</action>
      <benefit>quản lý buckets với bất kỳ S3-compatible tool nào</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Tạo bucket: tên unique, chỉ chứa lowercase alphanumeric + dấu gạch ngang, 3-63 ký tự (S3 naming rules).</criterion>
    <criterion id="AC-02">Xoá bucket: chỉ xoá được bucket trống (không có objects). Trả lỗi nếu bucket còn objects.</criterion>
    <criterion id="AC-03">Option force delete: xoá bucket + tất cả objects bên trong (cần confirm).</criterion>
    <criterion id="AC-04">Bucket policy: public (mọi object accessible không cần auth) hoặc private (mặc định).</criterion>
    <criterion id="AC-05">List buckets: trả danh sách tất cả buckets với metadata (name, createdAt, objectCount, totalSize).</criterion>
    <criterion id="AC-06">Tạo thư mục tương ứng trên filesystem khi tạo bucket.</criterion>
  </acceptance-criteria>
</feature>
