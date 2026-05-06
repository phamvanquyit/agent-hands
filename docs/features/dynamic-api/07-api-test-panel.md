<feature>
  <meta>
    <id>dynamic_api_test_panel</id>
    <title>API test panel</title>
    <group>Dynamic API</group>
    <status>planned</status>
    <priority>p1</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Panel test tích hợp trong editor, cho phép gửi request test tới
    dynamic endpoint và xem response. Giống mini Postman.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>nhấn "Test" trên editor → gửi request test</action>
      <benefit>test API ngay trong app mà không cần Postman/curl</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Panel test bên phải hoặc bên dưới code editor.</criterion>
    <criterion id="AC-02">Form inputs: Method (auto-fill), URL (auto-fill), Headers (editable), Query params, Body (JSON editor).</criterion>
    <criterion id="AC-03">Nút "Send" → gọi request tới endpoint.</criterion>
    <criterion id="AC-04">Response hiển thị: Status code (colored), Headers, Body (JSON formatted), Execution time.</criterion>
    <criterion id="AC-05">History: lưu lại 10 requests gần nhất.</criterion>
    <criterion id="AC-06">Copy cURL command.</criterion>
  </acceptance-criteria>
</feature>
