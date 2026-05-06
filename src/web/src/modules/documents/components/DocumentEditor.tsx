import { useCallback, useEffect, useRef, useState } from "react";
import "./DocumentEditor.css";
import { Spin, Typography } from "antd";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useShallow } from "zustand/react/shallow";
import { useDocumentsStore } from "../stores/document.store";

const { Text } = Typography;

export default function DocumentEditor() {
  const { activeDoc, docLoading, saveStatus, updateDocument } = useDocumentsStore(
    useShallow((s) => ({
      activeDoc: s.activeDoc,
      docLoading: s.docLoading,
      saveStatus: s.saveStatus,
      updateDocument: s.updateDocument,
    })),
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync from store when activeDoc changes
  useEffect(() => {
    if (activeDoc) {
      setTitle(activeDoc.title);
      setContent(activeDoc.content);
      setIsPreview(false);
    }
  }, [activeDoc?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save content with debounce
  const debouncedSave = useCallback(
    (projectId: string, id: string, data: { title?: string; content?: string }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updateDocument(projectId, id, data);
      }, 1000);
    },
    [updateDocument],
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (activeDoc?.projectId) {
      debouncedSave(activeDoc.projectId, activeDoc.id, { title: newTitle });
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (activeDoc?.projectId) {
      debouncedSave(activeDoc.projectId, activeDoc.id, { content: newContent });
    }
  };

  // Handle tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + "  " + content.slice(end);
      setContent(newContent);
      if (activeDoc?.projectId) {
        debouncedSave(activeDoc.projectId, activeDoc.id, { content: newContent });
      }
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  };

  if (docLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!activeDoc) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-hairline-soft shrink-0">
        <div className="flex items-center gap-1.5 min-h-[20px]">
          {saveStatus === "saving" && (
            <>
              <Loader2 size={13} className="animate-spin" />
              <Text type="secondary" style={{ fontSize: 12 }}>Saving...</Text>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check size={13} style={{ color: "var(--color-success)" }} />
              <Text type="secondary" style={{ fontSize: 12 }}>Saved</Text>
            </>
          )}
          {saveStatus === "error" && (
            <>
              <AlertCircle size={13} style={{ color: "var(--color-error)" }} />
              <Text type="danger" style={{ fontSize: 12 }}>Save failed</Text>
            </>
          )}
        </div>

        <div className="flex bg-surface-card rounded-sm p-0.5">
          <button
            className={`py-1.5 px-3.5 border-none bg-transparent text-xs font-semibold rounded-xs cursor-pointer transition-all duration-150 ${
              !isPreview
                ? "bg-canvas text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                : "text-muted hover:text-body"
            }`}
            onClick={() => setIsPreview(false)}
          >
            Edit
          </button>
          <button
            className={`py-1.5 px-3.5 border-none bg-transparent text-xs font-semibold rounded-xs cursor-pointer transition-all duration-150 ${
              isPreview
                ? "bg-canvas text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                : "text-muted hover:text-body"
            }`}
            onClick={() => setIsPreview(true)}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="flex-1 overflow-y-auto px-12 py-8 max-w-[900px] mx-auto w-full">
        <input
          className="block w-full border-none outline-none bg-transparent font-display text-4xl font-medium text-ink tracking-[-0.5px] leading-[1.2] mb-6 p-0 placeholder:text-hairline"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          spellCheck={false}
        />

        {/* Content */}
        {isPreview ? (
          <div className="doc-markdown-preview">
            {content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <p className="text-muted-soft italic">Nothing to preview</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            className="block w-full min-h-[calc(100vh-240px)] border-none outline-none bg-transparent font-sans text-[15px] leading-[1.7] text-body resize-none p-0 [tab-size:2]"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write in Markdown..."
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}
