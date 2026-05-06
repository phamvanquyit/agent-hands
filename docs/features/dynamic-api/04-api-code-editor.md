<feature>
  <meta>
    <id>dynamic_api_code_editor</id>
    <title>Code editor cho API</title>
    <group>Dynamic API</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Monaco editor cho phép viết Python code xử lý API. Hỗ trợ syntax
    highlight, auto-complete cho injected context (request, db, variables...),
    error markers, và Ctrl+S để save.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>viết Python code trong editor với code completion</action>
      <benefit>trải nghiệm coding tốt, giảm lỗi</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Monaco editor với Python language mode.</criterion>
    <criterion id="AC-02">Syntax highlighting cho Python.</criterion>
    <criterion id="AC-03">Auto-complete cho: request object (method, path, params, query, headers, body), context object (db, variables, tables, docs, files).</criterion>
    <criterion id="AC-04">Ctrl+S / Cmd+S → save code.</criterion>
    <criterion id="AC-05">Line numbers, minimap, word wrap toggle.</criterion>
    <criterion id="AC-06">Error markers hiển thị nếu Python syntax error (lint trước khi save).</criterion>
    <criterion id="AC-07">Sidebar reference: danh sách available methods của context SDK.</criterion>
  </acceptance-criteria>
</feature>
