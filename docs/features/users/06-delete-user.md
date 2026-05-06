<feature>
  <meta>
    <id>user_delete</id>
    <title>Xoá user</title>
    <group>Users</group>
    <status>planned</status>
    <priority>p1</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Admin xoá tài khoản user khỏi hệ thống. Super admin không thể bị xoá.
    Xoá user sẽ invalidate mọi session/token của user đó.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Admin</actor>
      <action>xoá tài khoản user không còn cần thiết</action>
      <benefit>quản lý danh sách user gọn gàng, thu hồi quyền truy cập</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút "Delete" hiển thị trên mỗi user row (trừ super admin).</criterion>
    <criterion id="AC-02">Không thể xoá super admin — nút disabled hoặc ẩn.</criterion>
    <criterion id="AC-03">Không thể tự xoá chính mình.</criterion>
    <criterion id="AC-04">Click Delete → dialog xác nhận "Xoá user [username]?" xuất hiện.</criterion>
    <criterion id="AC-05">Xác nhận → user biến mất khỏi danh sách, session bị invalidate.</criterion>
    <criterion id="AC-06">Huỷ dialog → không có thay đổi.</criterion>
    <criterion id="AC-07">Toast "Đã xoá user [username]" sau khi thành công.</criterion>
  </acceptance-criteria>
</feature>
