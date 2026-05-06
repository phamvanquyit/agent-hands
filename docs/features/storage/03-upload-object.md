<feature>
  <meta>
    <id>file_upload_object</id>
    <title>Upload object</title>
    <group>Storage</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Upload file vào bucket. Hỗ trợ qua cả S3-compatible API (PutObject)
    và REST API nội bộ. File lưu trên disk, metadata lưu DB.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>External client (S3 SDK)</actor>
      <action>gọi PutObject để upload file vào bucket</action>
      <benefit>lưu trữ file bằng S3 SDK quen thuộc</benefit>
    </story>
    <story id="US-02">
      <actor>User (UI)</actor>
      <action>drag-drop hoặc click Upload trên file browser</action>
      <benefit>upload file thông qua giao diện web</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">S3 API: PUT /{bucket}/{key} — nhận file body, lưu trên disk, tạo metadata trong DB.</criterion>
    <criterion id="AC-02">REST API: POST /api/storage/{bucket}/upload (multipart/form-data).</criterion>
    <criterion id="AC-03">Tự động detect content-type từ file extension (hoặc từ header Content-Type).</criterion>
    <criterion id="AC-04">Tính ETag (MD5) từ file content.</criterion>
    <criterion id="AC-05">Nếu object key đã tồn tại → overwrite (giống S3 behavior).</criterion>
    <criterion id="AC-06">Trả response tương thích S3: ETag, VersionId (nếu có), key.</criterion>
    <criterion id="AC-07">Validate file size không vượt giới hạn cấu hình.</criterion>
    <criterion id="AC-08">Tạo subfolder trên disk tự động nếu key chứa "/".</criterion>
  </acceptance-criteria>
</feature>
