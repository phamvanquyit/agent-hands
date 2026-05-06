<feature>
  <meta>
    <id>dynamic_api_logs</id>
    <title>API logs & monitoring</title>
    <group>Dynamic API</group>
    <status>planned</status>
    <priority>p2</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Ghi log mọi request tới dynamic endpoints: timestamp, method, path,
    status code, execution time, error (nếu có). Hiển thị trong UI để
    debug và monitor.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>xem logs của API endpoint để debug</action>
      <benefit>phát hiện và sửa lỗi nhanh chóng</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Tab "Logs" trong API editor page hiển thị request logs.</criterion>
    <criterion id="AC-02">Mỗi log entry: timestamp, method, path, status code, execution time (ms), IP.</criterion>
    <criterion id="AC-03">Click log entry → expand: request headers/body, response body, error stacktrace (nếu có).</criterion>
    <criterion id="AC-04">Filter: theo status (success/error), date range.</criterion>
    <criterion id="AC-05">Auto-refresh hoặc real-time (WebSocket).</criterion>
    <criterion id="AC-06">Retention: giữ logs 7 ngày (configurable), tự động cleanup.</criterion>
  </acceptance-criteria>
</feature>
