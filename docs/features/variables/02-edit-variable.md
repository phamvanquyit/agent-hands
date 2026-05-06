<feature>
  <meta>
    <id>variable_edit</id>
    <title>Chỉnh sửa variable</title>
    <group>Dynamic Variables</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User chỉnh sửa value, type, TTL của một variable. Key không thể đổi
    (xoá và tạo lại nếu muốn đổi key).
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click vào variable trong danh sách → chỉnh sửa value</action>
      <benefit>cập nhật giá trị runtime mà không cần xoá tạo lại</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Click variable row → inline edit hoặc dialog chỉnh sửa.</criterion>
    <criterion id="AC-02">Chỉnh sửa được: Value, Type, TTL.</criterion>
    <criterion id="AC-03">Key hiển thị read-only (không đổi được).</criterion>
    <criterion id="AC-04">Value editor thay đổi theo type: text input (string), number input (number), toggle (boolean), JSON editor (json).</criterion>
    <criterion id="AC-05">Save → cập nhật ngay, reset TTL countdown nếu TTL thay đổi.</criterion>
    <criterion id="AC-06">API: PATCH /api/variable-namespaces/:namespaceId/variables/:id → { value?, type?, ttl? }.</criterion>
  </acceptance-criteria>
</feature>
