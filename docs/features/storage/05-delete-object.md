<feature>
  <meta>
    <id>file_delete_object</id>
    <title>Delete object</title>
    <group>Storage</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Xoá object khỏi bucket. Xoá cả file trên disk và metadata trong DB.
    Hỗ trợ single delete và bulk delete.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>External client (S3 SDK)</actor>
      <action>gọi DeleteObject / DeleteObjects</action>
      <benefit>xoá file bằng S3 SDK</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">S3 API: DELETE /{bucket}/{key} — xoá file trên disk + metadata DB.</criterion>
    <criterion id="AC-02">Bulk delete: POST /{bucket}?delete — body chứa list keys cần xoá (S3 DeleteObjects).</criterion>
    <criterion id="AC-03">Trả 204 No Content khi xoá thành công (S3 behavior: không lỗi nếu key không tồn tại).</criterion>
    <criterion id="AC-04">Dọn dẹp thư mục rỗng trên disk sau khi xoá object (optional).</criterion>
    <criterion id="AC-05">REST API: DELETE /api/storage/{bucket}/{key}.</criterion>
  </acceptance-criteria>
</feature>
