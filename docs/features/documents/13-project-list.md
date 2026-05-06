<feature>
  <meta>
    <id>project_list</id>
    <title>Danh sách projects</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    Trang hiển thị danh sách tất cả projects dạng grid/list. User click vào
    project để vào workspace documents của project đó.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>xem danh sách projects → chọn project để làm việc</action>
      <benefit>navigate nhanh đến project cần thiết</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Trang "/projects" hiển thị danh sách projects dạng card grid.</criterion>
    <criterion id="AC-02">Mỗi card hiển thị: name, description (truncated), số documents, updated time.</criterion>
    <criterion id="AC-03">Click card → navigate vào project, sidebar hiển thị document tree của project.</criterion>
    <criterion id="AC-04">Nút "New Project" ở đầu trang.</criterion>
    <criterion id="AC-05">Sidebar có section "Projects" liệt kê tên projects — click để switch.</criterion>
    <criterion id="AC-06">Empty state khi chưa có project: illustration + "Create your first project" CTA.</criterion>
  </acceptance-criteria>
</feature>
