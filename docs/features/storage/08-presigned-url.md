<feature>
  <meta>
    <id>file_presigned_url</id>
    <title>Presigned URL (có thời hạn)</title>
    <group>Storage</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Tạo presigned URL cho private objects — URL chứa signature và thời hạn,
    cho phép truy cập tạm thời mà không cần credentials. Tương thích với
    S3 presigned URL format để S3 SDK (getSignedUrl) hoạt động.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Developer</actor>
      <action>dùng S3 SDK getSignedUrl() để tạo link tạm</action>
      <benefit>chia sẻ file private có thời hạn mà không expose credentials</benefit>
    </story>
    <story id="US-02">
      <actor>User (UI)</actor>
      <action>click "Get Link" trên file → chọn thời hạn → copy URL</action>
      <benefit>chia sẻ file tạm thời từ giao diện web</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Implement S3 presigned URL: query params X-Amz-Algorithm, X-Amz-Credential, X-Amz-Date, X-Amz-Expires, X-Amz-Signature.</criterion>
    <criterion id="AC-02">Server validate signature + expiry khi nhận request với presigned params.</criterion>
    <criterion id="AC-03">Hết hạn → trả 403 + XML error "Request has expired".</criterion>
    <criterion id="AC-04">Hỗ trợ presigned PUT (upload qua presigned URL, browser direct upload).</criterion>
    <criterion id="AC-05">REST API: POST /api/storage/{bucket}/{key}/presign { expiresIn: seconds } → { url, expiresAt }.</criterion>
    <criterion id="AC-06">Thời hạn mặc định: 3600s (1h), tối đa: 604800s (7 ngày).</criterion>
  </acceptance-criteria>
</feature>
