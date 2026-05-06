<feature>
  <meta>
    <id>user_roles</id>
    <title>Phân quyền (Roles)</title>
    <group>Users</group>
    <status>planned</status>
    <priority>p2</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Hệ thống phân quyền dựa trên role: superadmin, admin, member.
    Mỗi role có tập hợp quyền khác nhau, kiểm tra ở cả API và UI.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Super Admin</actor>
      <action>gán role cho user</action>
      <benefit>kiểm soát quyền truy cập của từng người dùng</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">3 roles: superadmin (toàn quyền), admin (quản lý users + mọi tính năng), member (sử dụng tính năng, không quản lý users).</criterion>
    <criterion id="AC-02">API middleware kiểm tra role trước khi xử lý request.</criterion>
    <criterion id="AC-03">UI ẩn/disable các nút/menu mà user không có quyền.</criterion>
    <criterion id="AC-04">superadmin role không thể bị gán hoặc thu hồi qua UI — chỉ tồn tại từ initial setup (seed). Zod schema cho create/update user chỉ chấp nhận admin/member.</criterion>
    <criterion id="AC-05">Trả 403 Forbidden nếu user không đủ quyền gọi API.</criterion>
  </acceptance-criteria>
</feature>
