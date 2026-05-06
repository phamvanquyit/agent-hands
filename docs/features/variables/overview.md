<feature>
  <meta>
    <id>variables_overview</id>
    <title>Dynamic Variables — Overview</title>
    <group>Dynamic Variables</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Dynamic Variables là key-value store giống Redis, cho phép lưu trữ
    và truy xuất dữ liệu dạng cặp key-value. Hỗ trợ nhiều kiểu giá trị
    (string, number, JSON, boolean), TTL (thời gian sống).

    Variables được tổ chức theo **Namespace** (variable namespace / project).
    Mỗi namespace là một entity riêng biệt (có id, name, description, icon).
    Variables là nested resource nằm trong namespace:
    `/api/variable-namespaces/:namespaceId/variables/...`

    Agents có thể đọc/ghi variables thông qua MCP tools
    để lưu trữ state, cache, hoặc config runtime.
  </overview>
</feature>

## Tính năng (atomic — theo thứ tự ưu tiên)

| #  | Tính năng                         | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | Tạo variable                      | [01-create-variable.md](01-create-variable.md)                  | ⬜ Planned | p0       |
| 02 | Chỉnh sửa variable                | [02-edit-variable.md](02-edit-variable.md)                      | ⬜ Planned | p0       |
| 03 | Xoá variable                      | [03-delete-variable.md](03-delete-variable.md)                  | ⬜ Planned | p0       |
| 04 | Variable browser UI               | [04-variable-browser.md](04-variable-browser.md)                | ⬜ Planned | p0       |
| 05 | Kiểu dữ liệu & TTL               | [05-data-types-ttl.md](05-data-types-ttl.md)                    | ⬜ Planned | p1       |
| 06 | Namespaces                        | [06-namespaces.md](06-namespaces.md)                            | ⬜ Planned | p1       |
| 07 | API CRUD cho variables            | [07-variable-api.md](07-variable-api.md)                        | ⬜ Planned | p0       |
