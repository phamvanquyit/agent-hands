<feature>
  <meta>
    <id>file_public_url</id>
    <title>Public file URL</title>
    <group>Storage</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Objects trong public bucket hoặc objects được đánh dấu public có thể
    truy cập trực tiếp qua URL mà không cần authentication. Phù hợp cho
    assets công khai: avatar, images, static files.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>đánh dấu object là public và copy URL</action>
      <benefit>sử dụng URL trực tiếp làm image source trong web, chia sẻ công khai</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Public bucket: mọi object trong bucket public accessible không cần auth.</criterion>
    <criterion id="AC-02">Per-object public: đánh dấu từng object là public (isPublic flag) trong private bucket.</criterion>
    <criterion id="AC-03">Public URL format: /public/{bucket}/{key} — không cần Authorization header.</criterion>
    <criterion id="AC-04">Set đúng Content-Type, cache headers (Cache-Control, ETag) cho static serving.</criterion>
    <criterion id="AC-05">Private object qua public URL → trả 403 Forbidden.</criterion>
    <criterion id="AC-06">Toggle public/private qua UI hoặc API: PATCH /api/storage/{bucket}/{key} { isPublic }.</criterion>
  </acceptance-criteria>
</feature>
