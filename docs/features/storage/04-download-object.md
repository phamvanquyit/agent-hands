<feature>
  <meta>
    <id>file_download_object</id>
    <title>Download object</title>
    <group>Storage</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Download/serve file từ bucket. Hỗ trợ qua S3-compatible API (GetObject)
    và REST API. Stream file từ disk, set đúng Content-Type và headers.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>External client (S3 SDK)</actor>
      <action>gọi GetObject để download file</action>
      <benefit>lấy file bằng S3 SDK/CLI</benefit>
    </story>
    <story id="US-02">
      <actor>Browser</actor>
      <action>truy cập URL public file</action>
      <benefit>hiển thị ảnh, tải file trực tiếp</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">S3 API: GET /{bucket}/{key} — stream file từ disk, set Content-Type, Content-Length, ETag headers.</criterion>
    <criterion id="AC-02">REST API: GET /api/storage/{bucket}/{key}.</criterion>
    <criterion id="AC-03">Hỗ trợ Range header cho partial download (streaming video, resume download).</criterion>
    <criterion id="AC-04">HEAD request: trả metadata mà không trả body (HeadObject).</criterion>
    <criterion id="AC-05">Trả 404 nếu object không tồn tại.</criterion>
    <criterion id="AC-06">Content-Disposition: inline cho browser-viewable types (image, pdf), attachment cho download.</criterion>
  </acceptance-criteria>
</feature>
