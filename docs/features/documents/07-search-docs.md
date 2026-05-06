<feature>
  <meta>
    <id>doc_search</id>
    <title>Tìm kiếm document</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p1</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    User tìm kiếm documents theo title hoặc nội dung trong phạm vi project
    hiện tại. Hỗ trợ quick search (Ctrl+K) và full-text search.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>nhấn Ctrl+K hoặc click ô search → gõ từ khoá</action>
      <benefit>tìm document nhanh mà không cần browse sidebar</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Ô search trên sidebar header hoặc Ctrl+K → search dialog.</criterion>
    <criterion id="AC-02">Tìm kiếm theo title (tức thì, debounce 300ms).</criterion>
    <criterion id="AC-03">Kết quả hiển thị dạng list: title + path + snippet nội dung matched.</criterion>
    <criterion id="AC-04">Click kết quả → mở document đó.</criterion>
    <criterion id="AC-05">Search mặc định scoped trong project hiện tại.</criterion>
    <criterion id="AC-06">API: GET /api/projects/:projectId/documents/search?q=keyword.</criterion>
  </acceptance-criteria>
</feature>
