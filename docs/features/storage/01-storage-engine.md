<feature>
  <meta>
    <id>file_storage_engine</id>
    <title>Local storage engine</title>
    <group>Storage</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Storage engine lưu trữ file objects trên local disk. Cấu trúc thư mục
    tổ chức theo bucket → object key. Metadata (tên, size, content-type,
    ETag, ACL...) lưu trong DB. File content lưu trên filesystem tại
    thư mục data cấu hình được (mặc định: data/storage/).
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>System</actor>
      <action>lưu trữ và phục vụ file objects</action>
      <benefit>cung cấp object storage mà không phụ thuộc dịch vụ bên ngoài</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Thư mục storage root cấu hình qua env var STORAGE_PATH (mặc định: ./data/storage/).</criterion>
    <criterion id="AC-02">Cấu trúc filesystem: {STORAGE_PATH}/{bucketName}/{objectKey} — objectKey có thể chứa "/" để tạo cấu trúc thư mục logic.</criterion>
    <criterion id="AC-03">DB table `objects`: id, bucketId, key, size, contentType, etag (MD5 hash), isPublic, createdAt, updatedAt.</criterion>
    <criterion id="AC-04">DB table `buckets`: id, name (unique), isPublic, createdAt.</criterion>
    <criterion id="AC-05">ETag tính bằng MD5 hash của file content (tương thích S3).</criterion>
    <criterion id="AC-06">Hỗ trợ object key có dạng path: images/avatars/user1.png (tạo subfolder tự động).</criterion>
    <criterion id="AC-07">Giới hạn file size cấu hình được (mặc định: 100MB per file).</criterion>
  </acceptance-criteria>
</feature>
