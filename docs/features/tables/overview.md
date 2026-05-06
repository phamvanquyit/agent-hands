<feature>
  <meta>
    <id>tables_overview</id>
    <title>Dynamic Table — Overview</title>
    <group>Dynamic Table</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Dynamic Table là tính năng database dạng bảng giống Notion. User có thể
    tạo nhiều bảng, mỗi bảng có các cột tuỳ chỉnh (text, number, select,
    date, checkbox, url, relation...). Dữ liệu được lưu dạng JSON linh hoạt,
    hỗ trợ sort, filter, và nhiều kiểu view.

    Tables được tổ chức theo **Database** — entity cấp cao nhất (có id, name,
    description, icon). Tables là nested resource nằm trong database:
    `/api/databases/:dbId/tables/...`

    Agents có thể đọc/ghi dữ liệu vào bảng thông qua MCP tools.
  </overview>
</feature>

## Tính năng (atomic — theo thứ tự ưu tiên)

| #  | Tính năng                         | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | Tạo bảng mới                      | [01-create-table.md](01-create-table.md)                        | ⬜ Planned | p0       |
| 02 | Chỉnh sửa bảng (tên, mô tả)      | [02-edit-table.md](02-edit-table.md)                            | ⬜ Planned | p0       |
| 03 | Xoá bảng                          | [03-delete-table.md](03-delete-table.md)                        | ⬜ Planned | p0       |
| 04 | Quản lý cột (properties)          | [04-column-management.md](04-column-management.md)              | ⬜ Planned | p0       |
| 05 | Thêm/sửa/xoá rows                | [05-row-crud.md](05-row-crud.md)                                | ⬜ Planned | p0       |
| 06 | Kiểu dữ liệu cột                 | [06-column-types.md](06-column-types.md)                        | ⬜ Planned | p0       |
| 07 | Sort & Filter                     | [07-sort-filter.md](07-sort-filter.md)                          | ⬜ Planned | p1       |
| 08 | Table views (Table/Board/List)    | [08-table-views.md](08-table-views.md)                          | ⬜ Planned | p2       |
| 09 | Row detail dialog                 | [09-row-detail.md](09-row-detail.md)                            | ⬜ Planned | p1       |
| 10 | API CRUD cho table data           | [10-table-api.md](10-table-api.md)                              | ⬜ Planned | p0       |
