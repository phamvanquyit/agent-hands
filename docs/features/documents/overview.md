<feature>
  <meta>
    <id>documents_overview</id>
    <title>Documents — Overview</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    Documents là tính năng soạn thảo tài liệu dạng block-based giống Notion.
    Mỗi document thuộc một Project cụ thể. User tạo, chỉnh sửa, tổ chức
    documents theo cây thư mục bên trong project. Mỗi document gồm nhiều
    blocks (paragraph, heading, list, code, image, table...).
    Agents có thể đọc/ghi documents thông qua MCP tools.

    **Project** là đơn vị tổ chức cao nhất — workspace chứa Documents.
    Mỗi project có name và description. User tạo projects để phân tách nội dung
    theo mục đích sử dụng (mỗi agent, mỗi khách hàng, hoặc mỗi dự án riêng).
  </overview>
</feature>

## Tính năng (atomic — theo thứ tự ưu tiên)

### Documents

| #  | Tính năng                         | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | Tạo document mới                  | [01-create-doc.md](01-create-doc.md)                            | ⬜ Planned | p0       |
| 02 | Chỉnh sửa document                | [02-edit-doc.md](02-edit-doc.md)                                | ⬜ Planned | p0       |
| 03 | Xoá document                      | [03-delete-doc.md](03-delete-doc.md)                            | ⬜ Planned | p0       |
| 04 | Block editor (block types)        | [04-block-editor.md](04-block-editor.md)                        | ⬜ Planned | p0       |
| 05 | Document tree (sidebar)           | [05-doc-tree.md](05-doc-tree.md)                                | ⬜ Planned | p0       |
| 06 | Nested documents (sub-pages)      | [06-nested-docs.md](06-nested-docs.md)                          | ⬜ Planned | p1       |
| 07 | Tìm kiếm document                 | [07-search-docs.md](07-search-docs.md)                          | ⬜ Planned | p1       |
| 08 | Document icon & cover             | [08-doc-icon-cover.md](08-doc-icon-cover.md)                    | ⬜ Planned | p2       |
| 09 | API CRUD cho documents            | [09-doc-api.md](09-doc-api.md)                                  | ⬜ Planned | p0       |

### Projects (Document Projects)

| #  | Tính năng                         | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 10 | Tạo project mới                   | [10-create-project.md](10-create-project.md)                    | ⬜ Planned | p0       |
| 11 | Chỉnh sửa project                 | [11-edit-project.md](11-edit-project.md)                        | ⬜ Planned | p0       |
| 12 | Xoá project                       | [12-delete-project.md](12-delete-project.md)                    | ⬜ Planned | p0       |
| 13 | Danh sách projects                 | [13-project-list.md](13-project-list.md)                        | ⬜ Planned | p0       |
| 14 | API CRUD cho projects              | [14-project-api.md](14-project-api.md)                          | ⬜ Planned | p0       |
