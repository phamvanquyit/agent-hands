import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Spin } from "antd";
import { useShallow } from "zustand/react/shallow";
import { useDocumentsStore } from "../stores/document.store";
import DocumentEditor from "../components/DocumentEditor";

export default function DocumentEditorPage() {
  const navigate = useNavigate();
  const { id: docId } = useParams<{ id: string }>();

  const {
    activeDoc,
    activeProject,
    docLoading,
    resolveDocument,
    fetchProject,
    setActiveProject,
    fetchDocuments,
  } = useDocumentsStore(
    useShallow((s) => ({
      activeDoc: s.activeDoc,
      activeProject: s.activeProject,
      docLoading: s.docLoading,
      resolveDocument: s.resolveDocument,
      fetchProject: s.fetchProject,
      setActiveProject: s.setActiveProject,
      fetchDocuments: s.fetchDocuments,
    })),
  );

  // Resolve document and its project on mount / URL change
  useEffect(() => {
    if (!docId) return;

    // If the active doc already matches, skip
    if (activeDoc?.id === docId) {
      // Make sure project is loaded
      if (activeDoc.projectId && !activeProject) {
        fetchProject(activeDoc.projectId).then((p) => {
          if (p) setActiveProject(p);
        });
      }
      return;
    }

    const load = async () => {
      const doc = await resolveDocument(docId);
      if (!doc) {
        navigate("/documents", { replace: true });
        return;
      }
      // Also load the project context
      if (doc.projectId) {
        const project = await fetchProject(doc.projectId);
        if (project) {
          setActiveProject(project);
          fetchDocuments(project.id);
        }
      }
    };
    load();
  }, [docId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (docLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-canvas">
        <div className="flex items-center justify-center min-h-[240px] flex-1">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!activeDoc) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-canvas">
        <div className="flex items-center justify-center min-h-[240px] flex-1">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  const projectId = activeDoc.projectId;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-canvas">
      <div className="px-6 py-4 border-b border-hairline shrink-0 flex items-center bg-surface-soft">
        <div className="flex items-center gap-2 text-muted font-mono text-[11px] uppercase tracking-wide">
           <span className="cursor-pointer hover:text-ink transition-colors" onClick={() => navigate("/documents")}>Projects</span>
           <span className="text-muted-soft">/</span>
           <span 
              className="cursor-pointer hover:text-ink transition-colors" 
              onClick={() => navigate(`/documents/project/${projectId}`)}
           >
              {activeProject?.name ?? "..."}
           </span>
           <span className="text-muted-soft">/</span>
           <span className="text-ink">{activeDoc.title || "Untitled"}</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex bg-canvas pb-6"> {/* Added padding bottom so editor is not flush if there's no native padding */}
        <DocumentEditor />
      </div>
    </div>
  );
}
