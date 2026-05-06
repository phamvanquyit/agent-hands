<feature>
  <meta>
    <id>dynamic_api_create</id>
    <title>Tạo API endpoint mới</title>
    <group>Dynamic API</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User tạo một API endpoint mới bằng cách định nghĩa: HTTP method,
    path, mô tả, và Python code xử lý. Code được lưu vào DB và sẵn sàng
    nhận request.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "New API" trên trang API Management</action>
      <benefit>tạo custom HTTP endpoint mà không cần sửa source code hoặc redeploy</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút "New API" trên trang API Management.</criterion>
    <criterion id="AC-02">Dialog/page tạo API với các trường: Name (bắt buộc), Method (GET/POST/PUT/PATCH/DELETE), Path (bắt buộc, bắt đầu bằng /), Description (optional).</criterion>
    <criterion id="AC-03">Path phải unique trong cùng method. Hỗ trợ path params: /users/:id.</criterion>
    <criterion id="AC-04">Code editor mở ra với template Python mặc định:</criterion>
    <criterion id="AC-05">Template code:
```python
def handler(request, context):
    """
    request: { method, path, params, query, headers, body }
    context: { db, variables, tables, docs, files }
    """
    return {
        "status": 200,
        "body": {"message": "Hello World"}
    }
```</criterion>
    <criterion id="AC-06">Save → API endpoint active ngay, có thể gọi qua /api/dynamic/[path].</criterion>
    <criterion id="AC-07">DB schema: id, name, method, path, description, code, isActive, createdAt, updatedAt.</criterion>
  </acceptance-criteria>
</feature>
