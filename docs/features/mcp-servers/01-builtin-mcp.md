<feature>
  <meta>
    <id>mcp_builtin_server</id>
    <title>Built-in MCP Server (System)</title>
    <group>MCP Servers</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-05</updated>
  </meta>

  <overview>
    Hệ thống luôn có sẵn một MCP server mặc định — **"System Tools"**. Server
    này không thể xoá hoặc đổi tên, và tự động expose các tool tương tác với
    internal services của toolkit. Khi AI agent kết nối qua MCP protocol, tất
    cả system tools đều available ngay mà không cần cấu hình thêm.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>AI Agent</actor>
      <action>kết nối tới MCP endpoint mặc định</action>
      <benefit>truy cập toàn bộ system tools (Variables, Tables, Docs, Files) mà không cần cấu hình</benefit>
    </story>
    <story id="US-02">
      <actor>Admin</actor>
      <action>xem Built-in MCP server trong danh sách</action>
      <benefit>biết server nào là system, server nào là custom</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Hệ thống seed một MCP server record trong DB khi khởi tạo: id = "mcp_system", name = "System Tools", type = "builtin".</criterion>
    <criterion id="AC-02">Server này KHÔNG thể xoá, đổi tên, hoặc thay đổi type.</criterion>
    <criterion id="AC-03">Server tự động expose các system tools:
      - **variables.get** / **variables.set** / **variables.delete** / **variables.list**
      - **tables.query** / **tables.insert** / **tables.update** / **tables.delete**
      - **documents.get** / **documents.search** / **documents.create** / **documents.update**
      - **files.list** / **files.get_url** / **files.upload** / **files.delete**
    </criterion>
    <criterion id="AC-04">Mỗi system tool có: name, description, inputSchema (JSON Schema), và execute function.</criterion>
    <criterion id="AC-05">System tools KHÔNG sử dụng Python sandbox — chúng gọi trực tiếp internal service layer (TypeScript).</criterion>
    <criterion id="AC-06">Trên UI, Built-in server hiển thị badge "System" và không có nút Delete/Rename.</criterion>
    <criterion id="AC-07">DB schema cho MCP servers: id, name, description, type (enum: "builtin" | "custom"), isActive, createdAt, updatedAt.</criterion>
  </acceptance-criteria>
</feature>
