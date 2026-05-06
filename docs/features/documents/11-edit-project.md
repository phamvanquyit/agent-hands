<feature>
  <meta>
    <id>project_edit</id>
    <title>Chỉnh sửa project</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    User chỉnh sửa thông tin project: đổi name, description.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>mở settings/menu của project → chỉnh sửa thông tin</action>
      <benefit>cập nhật tên, mô tả project cho chính xác</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Right-click project trong sidebar hoặc click "..." menu → "Edit" / "Settings".</criterion>
    <criterion id="AC-02">Dialog/form hiển thị name, description hiện tại → user edit inline.</criterion>
    <criterion id="AC-03">Save → cập nhật ngay trên sidebar và project header.</criterion>
    <criterion id="AC-04">API: PATCH /api/projects/:id → cập nhật name, description.</criterion>
  </acceptance-criteria>
</feature>
