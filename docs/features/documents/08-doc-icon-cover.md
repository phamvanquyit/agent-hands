<feature>
  <meta>
    <id>doc_icon_cover</id>
    <title>Document icon & cover</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p2</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    Mỗi document có thể có icon (emoji) và cover image, giống Notion.
    Hiển thị trên sidebar tree và editor header.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click icon area trên editor → chọn emoji</action>
      <benefit>dễ nhận diện document trong sidebar và khi browse</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Click icon placeholder → emoji picker mở ra.</criterion>
    <criterion id="AC-02">Chọn emoji → lưu và hiển thị trên sidebar + editor header.</criterion>
    <criterion id="AC-03">Hover cover area → nút "Add cover" xuất hiện.</criterion>
    <criterion id="AC-04">Cover: upload image hoặc chọn từ preset gradients/colors.</criterion>
    <criterion id="AC-05">Cover hiển thị dạng banner ở đầu editor.</criterion>
    <criterion id="AC-06">Nút "Remove" để xoá icon/cover.</criterion>
  </acceptance-criteria>
</feature>
