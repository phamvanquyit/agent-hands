<feature>
  <meta>
    <id>table_sort_filter</id>
    <title>Sort & Filter</title>
    <group>Dynamic Table</group>
    <status>done</status>
    <priority>p1</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User sort và filter dữ liệu bảng theo các cột. Hỗ trợ multi-sort,
    multi-filter với các điều kiện logic. Filter/sort state được lưu
    theo view.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "Sort" → chọn cột và thứ tự (ASC/DESC)</action>
      <benefit>sắp xếp dữ liệu theo tiêu chí mong muốn</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>click "Filter" → thêm điều kiện lọc theo cột</action>
      <benefit>chỉ hiển thị các rows phù hợp</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Nút "Sort" trên toolbar → dropdown chọn cột + ASC/DESC.</criterion>
    <criterion id="AC-02">Hỗ trợ multi-sort: thêm nhiều cấp sort.</criterion>
    <criterion id="AC-03">Nút "Filter" → form thêm điều kiện: cột, operator (is, is not, contains, >, <, ...), giá trị.</criterion>
    <criterion id="AC-04">Multi-filter: AND/OR logic giữa các điều kiện.</criterion>
    <criterion id="AC-05">Filter/Sort áp dụng real-time khi thay đổi.</criterion>
    <criterion id="AC-06">Badge hiển thị số lượng sort/filter đang active trên toolbar.</criterion>
    <criterion id="AC-07">API hỗ trợ query params trên GET /api/databases/:dbId/tables/:id/rows: ?sort=col&order=asc&filter=[...]&filterLogic=and.</criterion>
  </acceptance-criteria>
</feature>
