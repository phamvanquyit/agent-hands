<feature>
  <meta>
    <id>storage_overview</id>
    <title>Storage — Overview</title>
    <group>Storage</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Storage là hệ thống object storage tự xây dựng, hoạt động giống
    MinIO/S3. App đóng vai trò là storage server — lưu trữ file trên local
    disk, expose S3-compatible API để client bên ngoài có thể kết nối bằng
    AWS SDK, MinIO SDK, mc CLI, hoặc bất kỳ S3-compatible client nào.

    Hỗ trợ: buckets, upload/download objects, public files (direct URL),
    presigned URLs (có thời hạn), và UI quản lý file trên web.
    Nội bộ: các features khác (Dynamic API, agents...) cũng truy cập
    storage qua internal service layer.
  </overview>
</feature>

## Tính năng (atomic — theo thứ tự ưu tiên)

| #  | Tính năng                         | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | Local storage engine              | [01-storage-engine.md](01-storage-engine.md)                    | ⬜ Planned | p0       |
| 02 | Bucket management                 | [02-bucket-management.md](02-bucket-management.md)              | ⬜ Planned | p0       |
| 03 | Upload object                     | [03-upload-object.md](03-upload-object.md)                      | ⬜ Planned | p0       |
| 04 | Download object                   | [04-download-object.md](04-download-object.md)                  | ⬜ Planned | p0       |
| 05 | Delete object                     | [05-delete-object.md](05-delete-object.md)                      | ⬜ Planned | p0       |
| 06 | S3-compatible API                 | [06-s3-compatible-api.md](06-s3-compatible-api.md)              | ⬜ Planned | p0       |
| 07 | Public file URL                   | [07-public-url.md](07-public-url.md)                            | ⬜ Planned | p0       |
| 08 | Presigned URL (có thời hạn)       | [08-presigned-url.md](08-presigned-url.md)                      | ⬜ Planned | p0       |
| 09 | File browser UI                   | [09-file-browser-ui.md](09-file-browser-ui.md)                  | ⬜ Planned | p1       |
| 10 | Access keys management            | [10-access-keys.md](10-access-keys.md)                          | ⬜ Planned | p1       |
