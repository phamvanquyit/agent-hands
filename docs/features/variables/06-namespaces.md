<feature>
  <meta>
    <id>variable_namespaces</id>
    <title>Namespaces</title>
    <group>Dynamic Variables</group>
    <status>planned</status>
    <priority>p1</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Namespaces (variable namespaces) là entity cấp cao nhất để tổ chức variables.
    Mỗi namespace có id, tên, mô tả, icon — giống một "project" chứa variables.
    Variables là nested resource nằm trong namespace. User tạo/xoá namespace
    qua UI hoặc API. Hỗ trợ flush toàn bộ variables trong namespace.

    API namespace: /api/variable-namespaces
    API variables trong namespace: /api/variable-namespaces/:namespaceId/variables
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>tạo namespace mới (ví dụ: "cache", "config", "agent:memory")</action>
      <benefit>tổ chức variables theo nhóm logic, dễ quản lý và tìm kiếm</benefit>
    </story>
    <story id="US-02">
      <actor>Agent</actor>
      <action>đọc/ghi variables trong namespace riêng</action>
      <benefit>tránh xung đột key giữa các agent hoặc hệ thống khác nhau</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Mỗi variable thuộc 1 namespace (qua namespaceId / projectId).</criterion>
    <criterion id="AC-02">Namespace là entity riêng biệt (DB table `variable_projects`): id, name, description, icon, createdBy, createdAt, updatedAt.</criterion>
    <criterion id="AC-03">Key unique trong cùng namespace (key ở namespace khác có thể trùng).</criterion>
    <criterion id="AC-04">UI: trang danh sách namespaces → click vào namespace → xem variables bên trong.</criterion>
    <criterion id="AC-05">Flush namespace: xoá tất cả variables trong namespace (có confirm). API: DELETE /api/variable-namespaces/:namespaceId/variables.</criterion>
    <criterion id="AC-06">Namespace CRUD API: GET/POST /api/variable-namespaces, GET/PATCH/DELETE /api/variable-namespaces/:namespaceId.</criterion>
  </acceptance-criteria>
</feature>
