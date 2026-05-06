<feature>
  <meta>
    <id>table_column_types</id>
    <title>Kiểu dữ liệu cột</title>
    <group>Dynamic Table</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Hệ thống hỗ trợ nhiều kiểu dữ liệu (column types) cho các cột trong
    bảng, tương tự Notion properties. Mỗi kiểu có UI input riêng và
    validation logic.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>chọn kiểu dữ liệu khi thêm hoặc đổi type cột</action>
      <benefit>mỗi loại dữ liệu có UI phù hợp (datepicker, dropdown, checkbox...)</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Hỗ trợ các column types: Text, Number, Select, Multi-select, Date, Checkbox, URL, Email.</criterion>
    <criterion id="AC-02">Text: input text thường, hỗ trợ multi-line.</criterion>
    <criterion id="AC-03">Number: input number, format hiển thị (integer, decimal, currency, percent).</criterion>
    <criterion id="AC-04">Select: dropdown single-choice, user tự tạo options với màu sắc.</criterion>
    <criterion id="AC-05">Multi-select: dropdown multi-choice, tags hiển thị trong cell.</criterion>
    <criterion id="AC-06">Date: datepicker, tuỳ chọn include time.</criterion>
    <criterion id="AC-07">Checkbox: toggle boolean.</criterion>
    <criterion id="AC-08">URL: input text, click → mở tab mới.</criterion>
    <criterion id="AC-09">Email: input text, validate email format.</criterion>
    <criterion id="AC-10">Đổi column type: dữ liệu cũ được chuyển đổi hoặc xoá nếu không tương thích (có confirm).</criterion>
  </acceptance-criteria>
</feature>
