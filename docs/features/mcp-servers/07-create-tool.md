<feature>
  <meta>
    <id>mcp_create_tool</id>
    <title>Tạo tool mới</title>
    <group>MCP Servers</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-05</updated>
  </meta>

  <overview>
    User tạo một tool mới trong một custom MCP server. Tool là một function
    Python chạy trong sandbox. User định nghĩa: tên tool, mô tả, input
    schema (parameters), và Python code xử lý.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "New Tool" trên trang MCP server detail</action>
      <benefit>tạo tool mới để AI agents có thể gọi qua MCP protocol</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút "New Tool" trên trang MCP server detail (chỉ custom server).</criterion>
    <criterion id="AC-02">Navigate tới trang tạo tool: /mcp-servers/:serverId/tools/new.</criterion>
    <criterion id="AC-03">Form tạo tool gồm:
      - **Name** (bắt buộc): tên tool, snake_case, unique trong server. VD: get_weather, send_email.
      - **Description** (bắt buộc): mô tả tool cho AI agent hiểu khi nào nên dùng.
      - **Input Schema** (optional): JSON Schema định nghĩa parameters. UI có visual schema builder hoặc raw JSON editor.
      - **Python Code** (bắt buộc): code xử lý khi tool được gọi.
    </criterion>
    <criterion id="AC-04">Name phải snake_case, chỉ chứa lowercase alphanumeric và underscore. Tối đa 100 ký tự.</criterion>
    <criterion id="AC-05">Name phải unique trong cùng MCP server.</criterion>
    <criterion id="AC-06">Python code template mặc định:
```python
def execute(params, context):
    """
    params: dict — input parameters từ AI agent (theo input schema)
    context: object — SDK truy cập internal services
      - context.variables.get(key) / set(key, value)
      - context.tables.query(table_id, filters)
      - context.files.get_url(file_id)
      - context.http.get(url) / post(url, data)
    """
    # Your tool logic here
    return {
        "result": "Hello from tool!"
    }
```
    </criterion>
    <criterion id="AC-07">Save → tool xuất hiện trong danh sách tools của server, mặc định isActive = true.</criterion>
    <criterion id="AC-08">API: POST /api/mcp-servers/:serverId/tools → { name, description, inputSchema?, code }.</criterion>
    <criterion id="AC-09">DB schema cho tools: id, serverId (FK → mcp_servers), name, description, inputSchema (JSON), code (TEXT), isActive, createdAt, updatedAt.</criterion>
  </acceptance-criteria>
</feature>
