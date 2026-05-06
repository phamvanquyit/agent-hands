<feature>
  <meta>
    <id>variable_create</id>
    <title>Tạo variable</title>
    <group>Dynamic Variables</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User tạo một variable mới (cặp key-value). Key là unique trong
    namespace, value có thể là string, number, boolean, hoặc JSON object.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "Add Variable" trên trang Variables</action>
      <benefit>lưu trữ dữ liệu key-value để agents hoặc APIs sử dụng</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút "Add Variable" trên trang Variable browser.</criterion>
    <criterion id="AC-02">Click → dialog/inline form: Key (bắt buộc), Value (bắt buộc), Type (auto-detect hoặc chọn: string/number/boolean/json), TTL (optional, seconds, 0 = không hết hạn). Variable được tạo trong namespace hiện tại.</criterion>
    <criterion id="AC-03">Key chỉ chứa alphanumeric, dấu gạch ngang, gạch dưới, dấu chấm. Tối đa 255 ký tự.</criterion>
    <criterion id="AC-04">Key phải unique trong cùng namespace.</criterion>
    <criterion id="AC-05">Save → variable xuất hiện trong danh sách.</criterion>
    <criterion id="AC-06">API: POST /api/variable-namespaces/:namespaceId/variables → { key, value, type?, ttl? }. Nếu key đã tồn tại trong namespace → upsert (update value).</criterion>
  </acceptance-criteria>
</feature>
