<feature>
  <meta>
    <id>mcp_python_sandbox</id>
    <title>Python sandbox executor</title>
    <group>MCP Servers</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-05</updated>
  </meta>

  <overview>
    Khi AI agent gọi một tool, hệ thống thực thi Python code trong một
    sandbox an toàn. Sandbox tự động cài đặt thư viện Python mà code import,
    và cache virtual environment để lần chạy thứ 2 trở đi nhanh hơn đáng kể.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>AI Agent</actor>
      <action>gọi tool qua MCP protocol</action>
      <benefit>tool Python code được thực thi an toàn trong sandbox và trả về kết quả</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>viết tool code với import thư viện bên ngoài (requests, pandas, etc.)</action>
      <benefit>thư viện tự động được cài đặt mà không cần cấu hình thủ công</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Sandbox chạy Python code trong subprocess riêng biệt, cách ly khỏi main process.</criterion>
    <criterion id="AC-02">Mỗi tool có một **virtual environment (venv)** riêng, được cache trên disk:
      ```
      data/tool-venvs/<toolId>/
      ├── venv/           # Python venv directory
      ├── requirements.txt # Auto-detected dependencies
      └── last_used.txt   # Timestamp — dùng để GC
      ```
    </criterion>
    <criterion id="AC-03">**Auto-detect dependencies**: Trước khi execute, sandbox phân tích code để tìm import statements:
      1. Parse Python code → extract tất cả `import X` và `from X import Y`.
      2. Loại bỏ stdlib modules (os, sys, json, ...).
      3. Map module name → pip package name (VD: `import cv2` → `opencv-python`).
      4. So sánh với requirements.txt hiện tại → chỉ `pip install` khi có package mới.
    </criterion>
    <criterion id="AC-04">**Lần chạy đầu tiên**: tạo venv + pip install → chậm (có thể 10-30s tuỳ packages).
      Lần chạy thứ 2+: reuse venv → chỉ mất thời gian execute code (~ms nếu code nhẹ).
    </criterion>
    <criterion id="AC-05">Execution flow:
      1. Nhận tool call: { toolId, params }.
      2. Load tool code từ DB.
      3. Tìm hoặc tạo venv cho toolId.
      4. Detect và install dependencies nếu cần.
      5. Tạo wrapper script inject params + context SDK.
      6. Spawn `python wrapper.py` trong venv.
      7. Capture stdout/stderr.
      8. Parse result JSON từ stdout.
      9. Return result hoặc error.
    </criterion>
    <criterion id="AC-06">**Timeout**: mặc định 30s, configurable per tool. Quá timeout → kill process, trả error.</criterion>
    <criterion id="AC-07">**Context SDK injection**: Python code nhận `context` object với methods gọi internal APIs:
      ```python
      # Context SDK — gọi internal services qua HTTP localhost
      context.variables.get(key, namespace="default")
      context.variables.set(key, value, namespace="default", ttl=0)
      context.tables.query(table_id, filters=None)
      context.tables.insert(table_id, data)
      context.files.get_url(file_id, signed=True)
      context.http.get(url, headers=None)
      context.http.post(url, data=None, headers=None)
      ```
    </criterion>
    <criterion id="AC-08">**Error handling**:
      - Python syntax error → trả error message với line number.
      - Runtime exception → trả error message + stacktrace (dev mode) hoặc generic message (production).
      - Timeout → trả 504-equivalent error.
      - Missing dependency install fail → trả error + pip output.
    </criterion>
    <criterion id="AC-09">**Venv garbage collection**: Một scheduled job xoá venv không dùng > 7 ngày (configurable) để tiết kiệm disk.</criterion>
    <criterion id="AC-10">**Security**:
      - Sandbox chạy với quyền hạn chế (không cho truy cập filesystem ngoài venv).
      - Giới hạn memory (mặc định 256MB).
      - Giới hạn CPU time.
      - Không cho network access ngoài localhost (tuỳ config, mặc định cho phép).
    </criterion>
  </acceptance-criteria>
</feature>
