<feature>
  <meta>
    <id>variable_data_types_ttl</id>
    <title>Kiểu dữ liệu & TTL</title>
    <group>Dynamic Variables</group>
    <status>planned</status>
    <priority>p1</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Variables hỗ trợ nhiều kiểu dữ liệu và có thể cấu hình TTL (Time To Live).
    Khi hết TTL, variable tự động bị xoá hoặc đánh dấu expired.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User / Agent</actor>
      <action>tạo variable với TTL để lưu cache tạm thời</action>
      <benefit>dữ liệu tự cleanup sau thời gian nhất định</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Kiểu dữ liệu: string, number, boolean, json (object/array).</criterion>
    <criterion id="AC-02">Value lưu dạng text trong DB, type metadata dùng để parse/validate khi đọc.</criterion>
    <criterion id="AC-03">TTL: số giây, 0 hoặc null = không hết hạn (persistent).</criterion>
    <criterion id="AC-04">Trường expiresAt trong DB = createdAt + TTL seconds. Null nếu persistent.</criterion>
    <criterion id="AC-05">Background job (hoặc lazy check) tự động xoá variables đã expired.</criterion>
    <criterion id="AC-06">API trả 404 nếu variable đã expired (dù chưa xoá physical).</criterion>
    <criterion id="AC-07">Auto-detect type khi tạo: "123" → number, "true"/"false" → boolean, "{...}" → json, còn lại → string.</criterion>
  </acceptance-criteria>
</feature>
