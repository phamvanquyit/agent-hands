<feature>
  <meta>
    <id>mcp_tool_code_editor</id>
    <title>Tool code editor</title>
    <group>MCP Servers</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-05</updated>
  </meta>

  <overview>
    Code editor nhúng trong UI cho phép user viết Python code cho tools.
    Editor hỗ trợ syntax highlighting, auto-completion cơ bản, và hiển thị
    context SDK reference.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>viết Python code trong editor trên trang tool</action>
      <benefit>phát triển tool logic trực tiếp trong browser, không cần IDE ngoài</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Sử dụng code editor library: Monaco Editor hoặc CodeMirror 6.</criterion>
    <criterion id="AC-02">Python syntax highlighting.</criterion>
    <criterion id="AC-03">Line numbers, code folding, bracket matching.</criterion>
    <criterion id="AC-04">Kích thước editor có thể resize (drag border hoặc full-screen toggle).</criterion>
    <criterion id="AC-05">Sidebar/panel hiển thị SDK reference: danh sách context.* functions với mô tả ngắn.</criterion>
    <criterion id="AC-06">Auto-save draft vào localStorage khi user đang edit (tránh mất code khi refresh).</criterion>
    <criterion id="AC-07">Nút "Format Code" (optional) — gọi server format bằng autopep8/black nếu có.</criterion>
    <criterion id="AC-08">Keyboard shortcuts: Ctrl+S / Cmd+S để save.</criterion>
  </acceptance-criteria>
</feature>
