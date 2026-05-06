<feature>
  <meta>
    <id>table_views</id>
    <title>Table views (Table/Board/List)</title>
    <group>Dynamic Table</group>
    <status>planned</status>
    <priority>p2</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Mỗi bảng có thể hiển thị dưới nhiều dạng view: Table (spreadsheet),
    Board (kanban), List. Mỗi view lưu riêng sort/filter/column visibility.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>chuyển đổi giữa các view (Table / Board / List)</action>
      <benefit>xem cùng dữ liệu dưới các góc nhìn khác nhau</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Tab bar view trên header bảng: click để chuyển view.</criterion>
    <criterion id="AC-02">Table view: dạng spreadsheet (mặc định).</criterion>
    <criterion id="AC-03">Board view: kanban theo một cột Select, drag-drop card giữa columns.</criterion>
    <criterion id="AC-04">List view: danh sách compact, hiển thị title + vài cột chính.</criterion>
    <criterion id="AC-05">Mỗi view lưu riêng: sort, filter, column visibility, column order.</criterion>
    <criterion id="AC-06">Thêm view mới: nút "+" → chọn loại view.</criterion>
  </acceptance-criteria>
</feature>
