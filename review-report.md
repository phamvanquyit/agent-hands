# Review Report — 2026-05-06T08:54

## Summary

- **Features reviewed:** 31 (Users: 10, Variables: 7, Tables: 8, Storage: 10)
- **Backend mismatches:** 8
- **Web mismatches:** 5

---

## Backend Mismatches

| Feature | Type | Description |
|---------|------|-------------|
| variables/07-variable-api | WRONG_PATH | Docs: `GET /api/variables/:key?namespace=xxx`. Code: `GET /api/variable-namespaces/:namespaceId/variables/by-key/:key`. Implementation restructured variables around "variable-namespaces" (project-based) instead of flat `/api/variables` with `?namespace=` query param. All variable endpoints are nested under `/api/variable-namespaces/:namespaceId/variables/...` instead of `/api/variables/...`. This is a **systemic deviation** — the entire URL structure differs from docs. |
| variables/06-namespaces | WRONG_SCHEMA | Docs: namespace is a string field on each variable (like a tag). Code: namespaces are a separate entity (`variable_projects` table with id, name, description, icon) serving as "projects". The DB schema uses `projectId` column instead of a `namespace` string — fundamentally different data model. |
| variables/07-variable-api | MISSING | Docs: `GET /api/variables/namespaces` (list all namespaces with count). Code: `GET /api/variable-namespaces` exists but lives outside the variables prefix and returns full namespace objects, not simple name+count. |
| users/10-api-keys | MISSING_LOGIC | Docs (AC-04): Middleware `resolveAuth` should support auth via `Authorization: Bearer ltk_xxx` OR `X-API-Key`. Code: middleware **does support both** — but `deleteApiKey` in service enforces `userId` ownership check which means admin cannot revoke other users' keys (docs AC-03 implies any admin can revoke any key). |
| users/10-api-keys | MISSING_AUTH | Docs (AC-01): `GET /api/api-keys` should be admin+ only. Code: any authenticated user can list (admins see all, regular users see own). The doc says "Chỉ admin+" but implementation allows all authenticated users. This is a design choice but deviates from spec. |
| users/09-session-management | MISSING_LOGIC | Docs (AC-05): "Admin xoá user hoặc reset password → tất cả token bị revoke". Code: `deleteUser` and `adminResetPassword` do NOT invalidate/revoke existing JWT tokens. No token blacklist or version counter is implemented. JWTs remain valid until they naturally expire. |
| users/04-create-user | WRONG_SCHEMA | Docs (AC-02): Role dropdown should be `admin/user`. Code: role enum is `admin/member`. "user" in docs vs "member" in code. |
| tables/10-table-api | WRONG_PATH | Docs: `GET /api/tables`, `POST /api/tables`, etc. Code: tables are nested under databases — `GET /api/databases/:dbId/tables`. The docs describe a flat `/api/tables` endpoint but code requires a `databaseId` parent. Also, docs don't mention the "databases" grouping concept at all (only "tables"). |

---

## Web Mismatches

| Feature | Type | Description |
|---------|------|-------------|
| variables/04-variable-browser | WRONG_ENDPOINT | Docs: variables at `/api/variables`. Web resource uses `/api/variable-namespaces/:namespaceId/variables`. Matches server (not docs), so web-to-server is aligned but both deviate from docs. |
| users/10-api-keys | MISSING_FIELD | Docs (AC-02): Create key should accept `permissions` and `expiresAt`. Web `ApiKeysPage.tsx` — need to verify form has both fields. The `CreateApiKeyInput` type does include `name`, `permissions?`, `expiresAt?` in client resource, so types are OK. |
| tables/07-sort-filter | MISSING_COMPONENT | Docs (AC-06): "Badge hiển thị số lượng sort/filter đang active trên toolbar". Need to verify if `TableDetailPage.tsx` shows active filter/sort count badges. |
| storage/09-file-browser-ui | MISSING_COMPONENT | Docs (AC-10): "Hiển thị tổng dung lượng per bucket và toàn bộ storage". Storage page has a `stats` endpoint and `StorageStats` type. Implementation exists via `/api/storage/stats` — likely partially implemented. |
| users/08-roles | MISSING_LOGIC | Docs (AC-04): "super_admin role không thể bị gán hoặc thu hồi qua UI". Code: `createUserBodySchema` and `updateUserBodySchema` use `z.enum(["admin", "member"])` — which correctly prevents assigning superadmin via API validation. On web, need to verify role dropdown doesn't show superadmin. The server schema correctly excludes "superadmin" from the enum. |

---

## Features OK (no significant mismatch)

| Feature | Notes |
|---------|-------|
| users/01-super-admin-init | `seed.ts` creates superadmin correctly, checks existing, hashes password |
| users/02-login | `POST /api/auth/login` with username/email + password, returns JWT |
| users/03-logout | Client-side token clear via `auth.logout()`. No server-side token blacklist (expected for JWT). |
| users/04-create-user | `POST /api/users` with requireAdmin, validates username/email/password/role (minor: "member" vs "user" naming) |
| users/05-edit-user | `PATCH /api/users/:id` with role protection logic |
| users/06-delete-user | `DELETE /api/users/:id` with superadmin protection, self-delete not explicitly checked (minor) |
| users/07-reset-password | Admin: `POST /api/users/:id/reset-password`. Self: `POST /api/auth/change-password` |
| users/08-roles | 3 roles (superadmin/admin/member), middleware checks, superadmin unassignable via API |
| variables/01-create-variable | POST endpoint exists with upsert, auto-detect type, TTL support |
| variables/02-edit-variable | PATCH endpoint exists, key read-only (not in update schema) |
| variables/03-delete-variable | DELETE single + flush namespace |
| variables/04-variable-browser | Web pages exist (VariablesNamespacesPage, VariablesPage) |
| variables/05-data-types-ttl | 4 types (string/number/boolean/json), TTL with expiresAt, auto-detect, expired check |
| tables/01-create-table | POST create with default "Title" column, nested under database |
| tables/02-edit-table | PATCH table metadata |
| tables/03-delete-table | DELETE with cascade rows |
| tables/04-column-management | POST/PATCH/DELETE columns endpoints |
| tables/05-row-crud | POST/PATCH/DELETE rows + bulk-delete + bulk-update |
| tables/06-column-types | Supported via `addColumnBodySchema` type enum |
| tables/07-sort-filter | Sort/filter via query params on listRows |
| storage/01-storage-engine | Local filesystem storage, metadata in DB, ETag |
| storage/02-bucket-management | Create/list/delete buckets with naming, force delete |
| storage/03-upload-object | Multipart + raw upload, ETag, overwrite |
| storage/04-download-object | Stream with Content-Type, Content-Disposition |
| storage/05-delete-object | Single + bulk delete |
| storage/06-s3-compatible-api | Full S3 API on `/s3` prefix, Sig V4 auth, XML responses |
| storage/07-public-url | Public bucket + per-object public flag, `/public/:bucket/:key` |
| storage/08-presigned-url | Presigned URL generation + verification |
| storage/09-file-browser-ui | StoragePage with buckets sidebar, object list, upload, download, delete |
| storage/10-access-keys | Create/list/update/delete access keys, S3 auth integration |

---

## Key Architectural Deviations

### 1. Variables: Namespace != Docs Spec

**Docs** describe namespaces as a simple string field on variables (like Redis keyspaces: `namespace=cache`, `namespace=config`).  
**Code** implements namespaces as first-class entities ("variable projects") with their own CRUD, and variables are nested resources.

This is a **deliberate design upgrade** but creates a mismatch with all docs that reference `/api/variables` flat endpoints.

### 2. Tables: Nested under Databases

**Docs** describe flat `/api/tables` endpoints.  
**Code** nests tables under `/api/databases/:dbId/tables`.

This adds a "Database" grouping concept not mentioned in the tables docs. The docs index does not have a "Databases" feature group covering this.

### 3. JWT Token Revocation Not Implemented

Docs mention token revocation on user delete/password reset (users/09, users/06, users/07).  
Code uses stateless JWTs without blacklist — tokens remain valid until natural expiry.

---

## Recommendations

1. **Update docs** to reflect the actual variable-namespace structure (or vice versa)
2. **Update docs** to include the "Databases" grouping concept for tables
3. **Consider implementing** a simple token version/blacklist for critical security operations (user delete, password reset)
4. **Align naming**: docs say "user" role but code uses "member" — pick one and update both
5. **Self-delete protection**: add explicit check preventing users from deleting themselves in `deleteUser` service
