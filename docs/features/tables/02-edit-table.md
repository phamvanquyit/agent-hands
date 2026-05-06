<feature>
  <meta>
    <id>table_edit</id>
    <title>Chỉnh sửa bảng (tên, mô tả)</title>
    <group>Dynamic Table</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User chỉnh sửa metadata của bảng: tên, mô tả, icon.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click vào tên bảng hoặc icon "Edit" trên header</action>
      <benefit>cập nhật thông tin bảng mà không ảnh hưởng dữ liệu</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Click tên bảng trên header → inline edit mode hoặc dialog.</criterion>
    <criterion id="AC-02">Chỉnh sửa được: tên, mô tả, icon.</criterion>
    <criterion id="AC-03">Tên bảng validate unique.</criterion>
    <criterion id="AC-04">Save → cập nhật ngay trên UI.</criterion>
    <criterion id="AC-05">API: PATCH /api/databases/:dbId/tables/:id.</criterion>
  </acceptance-criteria>
</feature>
