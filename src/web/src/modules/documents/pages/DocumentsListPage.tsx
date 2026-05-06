import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Modal, Form, Spin, Dropdown, message } from "antd";
import {
  Plus,
  FileText,
  MoreVertical,
  Trash2,
  ChevronRight,
  FolderOpen,
  Search,
  Pencil,
  Settings,
} from "lucide-react";
import type { DocumentItem } from "src/lib/types";
import { useShallow } from "zustand/react/shallow";
import { useDocumentsStore } from "../stores/document.store";

const { confirm } = Modal;

export default function DocumentsListPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const {
    activeProject,
    documents,
    docsLoading,
    fetchDocuments,
    fetchProject,
    setActiveProject,
    createDocument,
    deleteDocument,
    deleteProject,
  } = useDocumentsStore(
    useShallow((s) => ({
      activeProject: s.activeProject,
      documents: s.documents,
      docsLoading: s.docsLoading,
      fetchDocuments: s.fetchDocuments,
      fetchProject: s.fetchProject,
      setActiveProject: s.setActiveProject,
      createDocument: s.createDocument,
      deleteDocument: s.deleteDocument,
      updateProject: s.updateProject,
      deleteProject: s.deleteProject,
    })),
  );

  const [search, setSearch] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Load project and its documents
  useEffect(() => {
    if (!projectId) return;

    const load = async () => {
      if (!activeProject || activeProject.id !== projectId) {
        const project = await fetchProject(projectId);
        if (project) {
          setActiveProject(project);
        } else {
          navigate("/documents", { replace: true });
          return;
        }
      }
      fetchDocuments(projectId);
    };
    load();
  }, [projectId, activeProject?.id, fetchProject, setActiveProject, fetchDocuments, navigate]);

  const handleCreate = useCallback(async () => {
    if (!projectId) return;
    const doc = await createDocument(projectId);
    if (doc) {
      navigate(`/documents/${doc.id}`);
    }
  }, [projectId, createDocument, navigate]);

  const handleDelete = useCallback(
    (doc: DocumentItem) => {
      if (!projectId) return;
      confirm({
        title: <span className="font-mono text-[14px]">Delete Object</span>,
        content: `Target: ${doc.title}. This action is irreversible.`,
        okText: "Execute Delete",
        okType: "danger",
        async onOk() {
          await deleteDocument(projectId, doc.id);
          message.success("Record destroyed");
        },
      });
    },
    [projectId, deleteDocument],
  );

  const handleDeleteProject = useCallback(() => {
    if (!activeProject) return;
    confirm({
      title: <span className="font-mono text-[14px]">Delete Project</span>,
      content: "All connected documents will be disconnected and wiped.",
      okText: "Purge",
      okType: "danger",
      async onOk() {
        await deleteProject(activeProject.id);
        navigate("/documents", { replace: true });
        message.success("Project purged");
      },
    });
  }, [activeProject, deleteProject, navigate]);

  const filtered = search
    ? documents.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    : documents;

  const projectName = activeProject?.name ?? "...";

  return (
    <div className="flex flex-col h-full overflow-hidden bg-canvas">
      <div className="px-8 pt-10 pb-6 shrink-0 border-b border-hairline">
        
        <div className="flex items-center gap-2 mb-4 text-muted font-mono text-[11px] uppercase tracking-wide">
           <span className="cursor-pointer hover:text-ink transition-colors" onClick={() => navigate("/documents")}>Projects</span>
           <span className="text-muted-soft">/</span>
           <span className="text-ink">{projectName}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="font-display text-[32px] font-normal text-ink tracking-[-0.64px] m-0 flex items-center gap-3">
            <span className="inline-flex items-center justify-center text-muted border border-hairline w-10 h-10 rounded-md bg-surface-card">
              {activeProject?.icon || <FolderOpen size={20} strokeWidth={1.5} />}
            </span>
            {projectName}
          </h1>
          <div className="flex gap-2">
            <Dropdown
              menu={{
                items: [
                  {
                    key: "edit",
                    icon: <Pencil size={14} />,
                    label: <span className="font-mono text-[12px]">Configure</span>,
                    onClick: () => setEditModalOpen(true),
                  },
                  { type: "divider" },
                  {
                    key: "delete",
                    icon: <Trash2 size={14} />,
                    label: <span className="font-mono text-[12px]">Delete</span>,
                    danger: true,
                    onClick: handleDeleteProject,
                  },
                ],
              }}
              trigger={["click"]}
            >
              <button className="flex items-center justify-center w-[36px] h-[36px] border border-hairline rounded-md text-muted bg-canvas hover:bg-surface-card transition-colors cursor-pointer">
                 <Settings size={16} />
              </button>
            </Dropdown>
            <button 
              className="flex items-center gap-2 h-[36px] px-4 rounded-md bg-ink text-canvas font-medium text-[13px] hover:bg-opacity-90 transition-opacity cursor-pointer border-none"
              onClick={handleCreate}
            >
              <Plus size={16} />
              New Document
            </button>
          </div>
        </div>
        
        {documents.length > 3 && (
          <div className="mt-6 max-w-[320px]">
             <Input
              prefix={<Search size={14} className="text-muted" />}
              placeholder="Filter by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              className="bg-transparent border-hairline hover:border-hairline-strong focus-within:border-ink shadow-none text-[13px]"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {docsLoading ? (
          <div className="flex items-center justify-center min-h-[240px] flex-1">
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] flex-1 border border-dashed border-hairline-strong rounded-md bg-transparent m-auto max-w-[600px]">
             <FileText size={32} className="text-muted-soft mb-4" strokeWidth={1.5} />
             <div className="font-mono text-[12px] text-muted-soft uppercase tracking-wide mb-6">
                {search ? "No records found" : "Project is empty"}
             </div>
             {!search && (
               <button 
                  onClick={handleCreate}
                  className="bg-transparent border border-hairline-strong text-ink px-4 py-2 rounded-md font-medium text-[13px] hover:border-ink transition-colors cursor-pointer"
               >
                 Initialize Document
               </button>
             )}
          </div>
        ) : (
          <div className="flex flex-col border-t border-b border-hairline bg-canvas">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 py-3 px-4 bg-transparent cursor-pointer transition-colors duration-150 ease-in-out border-b border-hairline border-b-last-transparent hover:bg-[rgba(38,37,30,0.02)] group"
                onClick={() => navigate(`/documents/${doc.id}`)}
              >
                <span className="inline-flex items-center text-muted-soft shrink-0">
                  {doc.icon || <FileText size={16} strokeWidth={1.5} />}
                </span>
                
                <span className="flex-1 text-[14px] font-medium text-ink whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                   {doc.title || "Untitled"}
                </span>
                
                <span className="font-mono text-[11px] text-muted-soft shrink-0 mr-4">
                  {new Date(doc.updatedAt).toISOString().split('T')[0]}
                </span>
                
                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "delete",
                          icon: <Trash2 size={14} />,
                          label: "Delete",
                          danger: true,
                          onClick: (info) => {
                            info.domEvent.stopPropagation();
                            handleDelete(doc);
                          },
                        },
                      ],
                    }}
                    trigger={["click"]}
                  >
                    <button
                      className="inline-flex items-center justify-center w-8 h-8 bg-transparent border-none cursor-pointer text-muted rounded-sm p-0 transition-all duration-100 hover:text-ink hover:bg-surface-soft"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </Dropdown>
                </div>
                <ChevronRight size={14} className="text-muted-soft shrink-0 ml-2 transition-transform group-hover:text-ink group-hover:translate-x-1" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      {activeProject && (
        <EditProjectModal
          open={editModalOpen}
          project={activeProject}
          onClose={() => setEditModalOpen(false)}
          onSaved={() => setEditModalOpen(false)}
        />
      )}
    </div>
  );
}

// ── Edit Project Modal ──────────────────────────────────────────────────────────

function EditProjectModal({
  open,
  project,
  onClose,
  onSaved,
}: {
  open: boolean;
  project: { id: string; name: string; description: string | null };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const updateProject = useDocumentsStore((s) => s.updateProject);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: project.name,
        description: project.description ?? "",
      });
    }
  }, [open, project, form]);

  const handleSubmit = async (values: { name: string; description?: string }) => {
    setLoading(true);
    try {
      const updated = await updateProject(project.id, {
        name: values.name,
        description: values.description || null,
      });
      if (updated) {
        onSaved();
        message.success("Project updated");
      }
    } catch {
      message.error("Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Configuration"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={420}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        style={{ marginTop: 24 }}
      >
        <Form.Item
          name="name"
          label={<span className="font-mono text-[11px] text-muted tracking-wide uppercase">Project Name</span>}
          rules={[{ required: true, message: "Required" }]}
        >
          <Input autoFocus className="font-mono text-[13px] bg-canvas border-hairline focus:border-ink rounded-md py-2" />
        </Form.Item>
        <Form.Item name="description" label={<span className="font-mono text-[11px] text-muted tracking-wide uppercase">Description</span>}>
          <Input.TextArea
            autoSize={{ minRows: 3, maxRows: 5 }}
            className="text-[13px] bg-canvas border-hairline focus:border-ink rounded-md"
          />
        </Form.Item>
        <div className="flex justify-end gap-3 pt-4 border-t border-hairline mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-hairline text-[13px] font-medium text-ink bg-transparent rounded-md cursor-pointer hover:bg-canvas">Cancel</button>
          <button type="submit" disabled={loading} className="px-5 py-2 border border-transparent text-[13px] font-medium text-canvas bg-ink rounded-md cursor-pointer hover:bg-opacity-90 transition-opacity">
            Commit Changes
          </button>
        </div>
      </Form>
    </Modal>
  );
}
