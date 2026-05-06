<feature>
  <meta>
    <id>users_overview</id>
    <title>User Management — Overview</title>
    <group>Users</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Hệ thống quản lý người dùng cho phép xác thực, phân quyền và quản trị
    tài khoản. Khi cài đặt app lần đầu, một super admin được tạo tự động
    qua migration. Super admin có toàn quyền quản lý users: thêm, sửa, xoá,
    reset password. Mọi người dùng cần đăng nhập để truy cập hệ thống.
  </overview>
</feature>

## Tính năng (atomic — theo thứ tự ưu tiên)

| #  | Tính năng                         | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | Super admin init (migration)      | [01-super-admin-init.md](01-super-admin-init.md)                | ⬜ Planned | p0       |
| 02 | Đăng nhập (Login)                 | [02-login.md](02-login.md)                                      | ⬜ Planned | p0       |
| 03 | Đăng xuất (Logout)                | [03-logout.md](03-logout.md)                                    | ⬜ Planned | p0       |
| 04 | Thêm user mới                     | [04-create-user.md](04-create-user.md)                          | ⬜ Planned | p0       |
| 05 | Chỉnh sửa user                    | [05-edit-user.md](05-edit-user.md)                              | ⬜ Planned | p1       |
| 06 | Xoá user                          | [06-delete-user.md](06-delete-user.md)                          | ⬜ Planned | p1       |
| 07 | Reset password                    | [07-reset-password.md](07-reset-password.md)                    | ⬜ Planned | p1       |
| 08 | Phân quyền (Roles)                | [08-roles.md](08-roles.md)                                      | ⬜ Planned | p2       |
| 09 | Session management                | [09-session-management.md](09-session-management.md)            | ⬜ Planned | p2       |
