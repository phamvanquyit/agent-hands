<feature>
  <meta>
    <id>variable_delete</id>
    <title>Xoá variable</title>
    <group>Dynamic Variables</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User xoá một hoặc nhiều variables. Hỗ trợ xoá đơn lẻ và bulk delete.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>xoá variable không còn cần</action>
      <benefit>dọn dẹp dữ liệu key-value</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút "Delete" trên mỗi variable row hoặc context menu.</criterion>
    <criterion id="AC-02">Click → dialog xác nhận.</criterion>
    <criterion id="AC-03">Xác nhận → variable bị xoá khỏi DB.</criterion>
    <criterion id="AC-04">Hỗ trợ multi-select → bulk delete.</criterion>
    <criterion id="AC-05">Nút "Flush namespace" → xoá tất cả variables trong 1 namespace (confirm).</criterion>
    <criterion id="AC-06">API: DELETE /api/variable-namespaces/:namespaceId/variables/:id (single), DELETE /api/variable-namespaces/:namespaceId/variables (flush all in namespace).</criterion>
  </acceptance-criteria>
</feature>
