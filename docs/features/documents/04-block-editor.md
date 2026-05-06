<feature>
  <meta>
    <id>doc_block_editor</id>
    <title>Block editor (block types)</title>
    <group>Documents</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-01</updated>
  </meta>

  <overview>
    Block editor hỗ trợ nhiều kiểu block để soạn thảo nội dung phong phú.
    User gõ "/" để mở command menu chọn block type. Blocks có thể drag-drop
    để sắp xếp lại. Sử dụng thư viện editor (BlockNote, TipTap, hoặc
    tương tự) để handle rich-text editing.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>gõ "/" để mở command menu và chọn block type</action>
      <benefit>thêm nhiều loại nội dung (heading, list, code, image...) dễ dàng</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>drag handle bên trái block để sắp xếp lại</action>
      <benefit>tổ chức nội dung linh hoạt</benefit>
    </story>
  </user-stories>

  <acceptance-criteria>
    <criterion id="AC-01">Block types cơ bản: Paragraph, Heading (H1/H2/H3), Bulleted List, Numbered List, To-do (checkbox), Quote, Divider, Code block.</criterion>
    <criterion id="AC-02">Gõ "/" → slash command menu hiển thị danh sách block types.</criterion>
    <criterion id="AC-03">Markdown shortcuts: "# " → H1, "## " → H2, "- " → bullet list, "1. " → numbered list, "[] " → to-do, "> " → quote, "```" → code block.</criterion>
    <criterion id="AC-04">Inline formatting: Bold (Ctrl+B), Italic (Ctrl+I), Code (Ctrl+E), Link (Ctrl+K), Strikethrough.</criterion>
    <criterion id="AC-05">Drag handle ở bên trái mỗi block → kéo thả sắp xếp.</criterion>
    <criterion id="AC-06">Enter → tạo block mới bên dưới. Backspace ở block trống → xoá block, merge lên trên.</criterion>
    <criterion id="AC-07">Block data lưu dạng JSON array: [{ type, content, children? }].</criterion>
    <criterion id="AC-08">Image block: upload file hoặc paste URL, hiển thị preview.</criterion>
  </acceptance-criteria>
</feature>
