<feature>
  <meta>
    <id>file_browser_ui</id>
    <title>File browser UI</title>
    <group>Storage</group>
    <status>planned</status>
    <priority>p1</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Giao diện web để quản lý buckets và objects, giống MinIO Console.
    Hỗ trợ browse, upload, download, delete, toggle public, get presigned URL.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>mở trang Storage trên web để quản lý files</action>
      <benefit>quản lý objects trực quan mà không cần CLI hay SDK</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Trang Storage: sidebar hiển thị danh sách buckets, main area hiển thị objects trong bucket đang chọn.</criterion>
    <criterion id="AC-02">Object list: table view (key, size, content-type, last modified, public?) hoặc grid view (thumbnail cho images).</criterion>
    <criterion id="AC-03">Breadcrumb navigation khi browse vào "folder" (prefix).</criterion>
    <criterion id="AC-04">Upload: nút Upload + drag-drop zone, progress bar, multi-file.</criterion>
    <criterion id="AC-05">Download: click download icon trên object row.</criterion>
    <criterion id="AC-06">Delete: single hoặc multi-select → bulk delete (confirm dialog).</criterion>
    <criterion id="AC-07">Context menu per object: Download, Copy URL, Get Presigned URL, Toggle Public, Delete.</criterion>
    <criterion id="AC-08">Bucket management: nút Create Bucket, Delete Bucket, toggle bucket policy (public/private).</criterion>
    <criterion id="AC-09">Search/filter objects theo key.</criterion>
    <criterion id="AC-10">Hiển thị tổng dung lượng per bucket và toàn bộ storage.</criterion>
  </acceptance-criteria>
</feature>
