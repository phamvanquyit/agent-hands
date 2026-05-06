# Moro Agent Toolkit — Feature Tree

> Cây tính năng các nhóm cần phát triển. Tài liệu chi tiết cho từng feature nằm trong `docs/features/<group>/`.
>
> **Icons:** ✅ Done · 🚧 In Progress · ⬜ Planned

---

## 👤 [User Management](features/users/overview.md)

> Hệ thống quản lý người dùng: xác thực, phân quyền, quản trị tài khoản.

| #  | Tính năng                    | File                                                     | Status | Priority |
|----|------------------------------|----------------------------------------------------------|--------|----------|
| 01 | Super admin init (migration) | [01-super-admin-init.md](features/users/01-super-admin-init.md) | ✅ | p0  |
| 02 | Đăng nhập (Login)            | [02-login.md](features/users/02-login.md)                | ✅ | p0       |
| 03 | Đăng xuất (Logout)           | [03-logout.md](features/users/03-logout.md)              | ✅ | p0       |
| 04 | Thêm user mới                | [04-create-user.md](features/users/04-create-user.md)    | ✅ | p0       |
| 05 | Chỉnh sửa user              | [05-edit-user.md](features/users/05-edit-user.md)        | ✅ | p1       |
| 06 | Xoá user                     | [06-delete-user.md](features/users/06-delete-user.md)    | ✅ | p1       |
| 07 | Reset password               | [07-reset-password.md](features/users/07-reset-password.md) | ✅ | p1    |
| 08 | Phân quyền (Roles)           | [08-roles.md](features/users/08-roles.md)                | ✅ | p2       |
| 09 | Session management           | [09-session-management.md](features/users/09-session-management.md) | ✅ | p2 |
| 10 | API Keys management          | [10-api-keys.md](features/users/10-api-keys.md)          | 🚧 | p0       |

---

## 🔑 [Dynamic Variables](features/variables/overview.md)

> Key-value store giống Redis. Variables tổ chức theo **Namespaces** (entity riêng biệt). API: `/api/variable-namespaces/:namespaceId/variables/...`

| #  | Tính năng                    | File                                                     | Status | Priority |
|----|------------------------------|----------------------------------------------------------|--------|----------|
| 01 | Tạo variable                 | [01-create-variable.md](features/variables/01-create-variable.md) | ✅ | p0 |
| 02 | Chỉnh sửa variable           | [02-edit-variable.md](features/variables/02-edit-variable.md) | ✅ | p0   |
| 03 | Xoá variable                 | [03-delete-variable.md](features/variables/03-delete-variable.md) | ✅ | p0 |
| 04 | Variable browser UI          | [04-variable-browser.md](features/variables/04-variable-browser.md) | ✅ | p0 |
| 05 | Kiểu dữ liệu & TTL          | [05-data-types-ttl.md](features/variables/05-data-types-ttl.md) | ✅ | p1 |
| 06 | Namespaces                   | [06-namespaces.md](features/variables/06-namespaces.md)  | ✅ | p1       |
| 07 | API CRUD cho variables       | [07-variable-api.md](features/variables/07-variable-api.md) | ✅ | p0   |

---

## 📊 [Dynamic Table](features/tables/overview.md)

> Database dạng bảng giống Notion. Tables tổ chức theo **Databases** (entity riêng biệt). API: `/api/databases/:dbId/tables/...`

| #  | Tính năng                    | File                                                     | Status | Priority |
|----|------------------------------|----------------------------------------------------------|--------|----------|
| 01 | Tạo bảng mới                 | [01-create-table.md](features/tables/01-create-table.md) | ✅ | p0       |
| 02 | Chỉnh sửa bảng              | [02-edit-table.md](features/tables/02-edit-table.md)     | ✅ | p0       |
| 03 | Xoá bảng                     | [03-delete-table.md](features/tables/03-delete-table.md) | ✅ | p0       |
| 04 | Quản lý cột (properties)    | [04-column-management.md](features/tables/04-column-management.md) | ✅ | p0 |
| 05 | Thêm/sửa/xoá rows           | [05-row-crud.md](features/tables/05-row-crud.md)         | ✅ | p0       |
| 06 | Kiểu dữ liệu cột            | [06-column-types.md](features/tables/06-column-types.md) | ✅ | p0       |
| 07 | Sort & Filter                | [07-sort-filter.md](features/tables/07-sort-filter.md)   | ✅ | p1       |
| 08 | Table views (Table/Board/List)| [08-table-views.md](features/tables/08-table-views.md)  | ⬜ | p2       |
| 09 | Row detail dialog            | [09-row-detail.md](features/tables/09-row-detail.md)     | ⬜ | p1       |
| 10 | API CRUD cho table data      | [10-table-api.md](features/tables/10-table-api.md)       | ✅ | p0       |

## 📝 [Documents](features/documents/overview.md)

> Soạn thảo tài liệu block-based giống Notion. Documents thuộc một Project cụ thể.
> **Project** là đơn vị tổ chức cao nhất — workspace chứa Documents.

### Documents

| #  | Tính năng                    | File                                                     | Status | Priority |
|----|------------------------------|----------------------------------------------------------|--------|----------|
| 01 | Tạo document mới             | [01-create-doc.md](features/documents/01-create-doc.md)       | ⬜ | p0       |
| 02 | Chỉnh sửa document           | [02-edit-doc.md](features/documents/02-edit-doc.md)           | ⬜ | p0       |
| 03 | Xoá document                 | [03-delete-doc.md](features/documents/03-delete-doc.md)       | ⬜ | p0       |
| 04 | Block editor (block types)   | [04-block-editor.md](features/documents/04-block-editor.md)   | ⬜ | p0       |
| 05 | Document tree (sidebar)      | [05-doc-tree.md](features/documents/05-doc-tree.md)           | ⬜ | p0       |
| 06 | Nested documents (sub-pages) | [06-nested-docs.md](features/documents/06-nested-docs.md)     | ⬜ | p1       |
| 07 | Tìm kiếm document            | [07-search-docs.md](features/documents/07-search-docs.md)    | ⬜ | p1       |
| 08 | Document icon & cover        | [08-doc-icon-cover.md](features/documents/08-doc-icon-cover.md) | ⬜ | p2     |
| 09 | API CRUD cho documents       | [09-doc-api.md](features/documents/09-doc-api.md)             | ⬜ | p0       |

### Projects (Document Projects)

| #  | Tính năng                    | File                                                     | Status | Priority |
|----|------------------------------|----------------------------------------------------------|--------|----------|
| 10 | Tạo project mới              | [10-create-project.md](features/documents/10-create-project.md) | ⬜ | p0  |
| 11 | Chỉnh sửa project            | [11-edit-project.md](features/documents/11-edit-project.md) | ⬜ | p0      |
| 12 | Xoá project                  | [12-delete-project.md](features/documents/12-delete-project.md) | ⬜ | p0  |
| 13 | Danh sách projects           | [13-project-list.md](features/documents/13-project-list.md) | ⬜ | p0      |
| 14 | API CRUD cho projects        | [14-project-api.md](features/documents/14-project-api.md) | ⬜ | p0       |

---

## 📦 [Storage](features/storage/overview.md)

> Object storage tự xây dựng giống MinIO/S3: buckets, upload/download, presigned URLs.

| #  | Tính năng                    | File                                                     | Status | Priority |
|----|------------------------------|----------------------------------------------------------|--------|----------|
| 01 | Local storage engine         | [01-storage-engine.md](features/storage/01-storage-engine.md) | ✅ | p0    |
| 02 | Bucket management            | [02-bucket-management.md](features/storage/02-bucket-management.md) | ✅ | p0 |
| 03 | Upload object                | [03-upload-object.md](features/storage/03-upload-object.md) | ✅ | p0      |
| 04 | Download object              | [04-download-object.md](features/storage/04-download-object.md) | ✅ | p0  |
| 05 | Delete object                | [05-delete-object.md](features/storage/05-delete-object.md) | ✅ | p0      |
| 06 | S3-compatible API            | [06-s3-compatible-api.md](features/storage/06-s3-compatible-api.md) | ✅ | p0 |
| 07 | Public file URL              | [07-public-url.md](features/storage/07-public-url.md)      | ✅ | p0      |
| 08 | Presigned URL (có thời hạn)  | [08-presigned-url.md](features/storage/08-presigned-url.md) | ✅ | p0      |
| 09 | File browser UI              | [09-file-browser-ui.md](features/storage/09-file-browser-ui.md) | ✅ | p1  |
| 10 | Access keys management       | [10-access-keys.md](features/storage/10-access-keys.md)    | ✅ | p1      |

---

## 🔌 [MCP Servers](features/mcp-servers/overview.md)

> Quản lý MCP (Model Context Protocol) servers & Tools. Built-in server expose system tools, custom servers chứa user-defined Python tools chạy trong sandbox.

### MCP Server Management

| #  | Tính năng                    | File                                                     | Status | Priority |
|----|------------------------------|----------------------------------------------------------|--------|----------|
| 01 | Built-in MCP server (system) | [01-builtin-mcp.md](features/mcp-servers/01-builtin-mcp.md) | ⬜ | p0       |
| 02 | Tạo custom MCP server        | [02-create-mcp-server.md](features/mcp-servers/02-create-mcp-server.md) | ⬜ | p0 |
| 03 | Chỉnh sửa MCP server         | [03-edit-mcp-server.md](features/mcp-servers/03-edit-mcp-server.md) | ⬜ | p0 |
| 04 | Xoá MCP server               | [04-delete-mcp-server.md](features/mcp-servers/04-delete-mcp-server.md) | ⬜ | p0 |
| 05 | MCP management page          | [05-mcp-management.md](features/mcp-servers/05-mcp-management.md) | ⬜ | p0 |
| 06 | MCP connection endpoint      | [06-mcp-endpoint.md](features/mcp-servers/06-mcp-endpoint.md) | ⬜ | p0 |

### Tool Management

| #  | Tính năng                    | File                                                     | Status | Priority |
|----|------------------------------|----------------------------------------------------------|--------|----------|
| 07 | Tạo tool mới                 | [07-create-tool.md](features/mcp-servers/07-create-tool.md) | ⬜ | p0       |
| 08 | Chỉnh sửa tool               | [08-edit-tool.md](features/mcp-servers/08-edit-tool.md) | ⬜ | p0       |
| 09 | Xoá tool                     | [09-delete-tool.md](features/mcp-servers/09-delete-tool.md) | ⬜ | p0       |
| 10 | Tool code editor             | [10-tool-code-editor.md](features/mcp-servers/10-tool-code-editor.md) | ⬜ | p0 |
| 11 | Python sandbox executor      | [11-python-sandbox.md](features/mcp-servers/11-python-sandbox.md) | ⬜ | p0 |
| 12 | Tool test panel              | [12-tool-test-panel.md](features/mcp-servers/12-tool-test-panel.md) | ⬜ | p1 |
| 13 | Toggle tool active/inactive  | [13-toggle-tool.md](features/mcp-servers/13-toggle-tool.md) | ⬜ | p1 |
| 14 | Tool execution logs          | [14-tool-logs.md](features/mcp-servers/14-tool-logs.md) | ⬜ | p2       |

---

## ⚡ [Dynamic API](features/dynamic-api/overview.md)

> Tạo HTTP API endpoints tại runtime bằng Python code, sandbox execution.

| #  | Tính năng                    | File                                                     | Status | Priority |
|----|------------------------------|----------------------------------------------------------|--------|----------|
| 01 | Tạo API endpoint mới         | [01-create-api.md](features/dynamic-api/01-create-api.md) | ⬜ | p0     |
| 02 | Chỉnh sửa API endpoint       | [02-edit-api.md](features/dynamic-api/02-edit-api.md)    | ⬜ | p0       |
| 03 | Xoá API endpoint             | [03-delete-api.md](features/dynamic-api/03-delete-api.md) | ⬜ | p0     |
| 04 | Code editor cho API          | [04-api-code-editor.md](features/dynamic-api/04-api-code-editor.md) | ⬜ | p0 |
| 05 | Python runtime cho API       | [05-api-python-runner.md](features/dynamic-api/05-api-python-runner.md) | ⬜ | p0 |
| 06 | API request routing          | [06-api-routing.md](features/dynamic-api/06-api-routing.md) | ⬜ | p0   |
| 07 | API test panel               | [07-api-test-panel.md](features/dynamic-api/07-api-test-panel.md) | ⬜ | p1 |
| 08 | Toggle active/inactive       | [08-toggle-api.md](features/dynamic-api/08-toggle-api.md) | ⬜ | p1     |
| 09 | API logs & monitoring        | [09-api-logs.md](features/dynamic-api/09-api-logs.md)    | ⬜ | p2       |
| 10 | API management page          | [10-api-management.md](features/dynamic-api/10-api-management.md) | ⬜ | p0 |
