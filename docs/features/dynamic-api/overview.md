<feature>
  <meta>
    <id>dynamic_api_overview</id>
    <title>Dynamic API — Overview</title>
    <group>Dynamic API</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Dynamic API cho phép user tạo, chỉnh sửa, xoá các HTTP API endpoints
    tại runtime. Mỗi API endpoint là một file Python code được lưu trong DB.
    Khi có request gọi tới endpoint, hệ thống lấy code từ DB và thực thi
    trong sandbox Python runner. User có thể tạo REST APIs tuỳ chỉnh mà
    không cần deploy lại app. Code Python có thể truy cập internal services
    (Variables, Tables, Docs, Files) thông qua injected SDK.
  </overview>
</feature>

## Tính năng (atomic — theo thứ tự ưu tiên)

| #  | Tính năng                         | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | Tạo API endpoint mới              | [01-create-api.md](01-create-api.md)                            | ⬜ Planned | p0       |
| 02 | Chỉnh sửa API endpoint            | [02-edit-api.md](02-edit-api.md)                                | ⬜ Planned | p0       |
| 03 | Xoá API endpoint                   | [03-delete-api.md](03-delete-api.md)                            | ⬜ Planned | p0       |
| 04 | Code editor cho API                | [04-api-code-editor.md](04-api-code-editor.md)                  | ⬜ Planned | p0       |
| 05 | Python runtime cho API             | [05-api-python-runner.md](05-api-python-runner.md)              | ⬜ Planned | p0       |
| 06 | API request routing                | [06-api-routing.md](06-api-routing.md)                          | ⬜ Planned | p0       |
| 07 | API test panel                     | [07-api-test-panel.md](07-api-test-panel.md)                    | ⬜ Planned | p1       |
| 08 | Toggle active/inactive             | [08-toggle-api.md](08-toggle-api.md)                            | ⬜ Planned | p1       |
| 09 | API logs & monitoring              | [09-api-logs.md](09-api-logs.md)                                | ⬜ Planned | p2       |
| 10 | API management page                | [10-api-management.md](10-api-management.md)                    | ⬜ Planned | p0       |
