<feature>
  <meta>
    <id>doc_edit</id>
    <title>Chỉnh sửa document</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    User chỉnh sửa nội dung document bằng block editor. Hỗ trợ nhiều
    kiểu block, drag-drop sắp xếp, keyboard shortcuts. Auto-save sau
    mỗi thay đổi.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click vào document trong sidebar → mở editor</action>
      <benefit>chỉnh sửa nội dung tài liệu với trải nghiệm giống Notion</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Click document trong sidebar → mở editor ở main area.</criterion>
    <criterion id="AC-02">Title inline edit ở đầu trang.</criterion>
    <criterion id="AC-03">Content area hiển thị các blocks, click block → edit mode.</criterion>
    <criterion id="AC-04">Auto-save: debounce 1s sau mỗi thay đổi, gọi API PATCH.</criterion>
    <criterion id="AC-05">Hiển thị trạng thái "Saving..." / "Saved" trên header.</criterion>
    <criterion id="AC-06">Undo/Redo: Ctrl+Z / Ctrl+Shift+Z.</criterion>
    <criterion id="AC-07">API: PATCH /api/projects/:projectId/documents/:id → cập nhật title, blocks.</criterion>
  </acceptance-criteria>
</feature>
