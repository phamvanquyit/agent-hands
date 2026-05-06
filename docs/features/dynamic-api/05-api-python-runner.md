<feature>
  <meta>
    <id>dynamic_api_python_runner</id>
    <title>Python runtime cho API</title>
    <group>Dynamic API</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Khi request gọi tới dynamic endpoint, hệ thống lấy Python code từ DB
    và thực thi trong sandbox subprocess. Code nhận request data và context
    object với SDK để truy cập internal services. Kết quả trả về dạng
    { status, headers, body }.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>External client</actor>
      <action>gọi HTTP request tới dynamic endpoint</action>
      <benefit>nhận kết quả xử lý từ Python code tuỳ chỉnh</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Khi request match dynamic route → load code từ DB → exec trong sandbox.</criterion>
    <criterion id="AC-02">Sandbox: Python subprocess với timeout (mặc định 30s, configurable).</criterion>
    <criterion id="AC-03">Inject request object: { method, path, params, query, headers, body (parsed JSON) }.</criterion>
    <criterion id="AC-04">Inject context object với SDK functions:
      - context.variables.get(key, namespace?) / set(key, value, namespace?, ttl?)
      - context.tables.query(tableId, filters?) / insert(tableId, data) / update(tableId, rowId, data) / delete(tableId, rowId)
      - context.docs.get(docId) / search(query) / create(title, content) / update(docId, content)
      - context.files.list(folderId?) / get_url(fileId, signed?, expiresIn?) / upload(name, content)
    </criterion>
    <criterion id="AC-05">Handler function trả về dict: { status: int, headers?: dict, body: any }.</criterion>
    <criterion id="AC-06">Body tự động serialize thành JSON nếu là dict/list.</criterion>
    <criterion id="AC-07">Exception trong code → trả 500 + error message (production: generic, dev: stacktrace).</criterion>
    <criterion id="AC-08">Timeout → trả 504 Gateway Timeout.</criterion>
    <criterion id="AC-09">Logging: ghi access log + execution time vào activity log.</criterion>
  </acceptance-criteria>
</feature>
