import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Modal, Form, message, Spin, Dropdown } from "antd";
import {
  Plus,
  FolderOpen,
  MoreVertical,
  Trash2,
  ChevronRight,
  Search,
  Pencil,
  Terminal,
  FileText,
} from "lucide-react";
import type { Project } from "src/lib/types";
import { useShallow } from "zustand/react/shallow";
import { useDocumentsStore } from "../stores/document.store";

const { confirm } = Modal;

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, projectsLoading, fetchProjects, deleteProject } =
    useDocumentsStore(
      useShallow((s) => ({
        projects: s.projects,
        projectsLoading: s.projectsLoading,
        fetchProjects: s.fetchProjects,
        deleteProject: s.deleteProject,
      })),
    );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const handleEdit = useCallback((project: Project) => {
    setEditingProject(project);
    setModalOpen(true);
  }, []);

  const handleDeleteProject = useCallback(
    (project: Project) => {
      confirm({
        title: `Delete project "${project.name}"?`,
        content: "All documents in this project will be deleted. This cannot be undone.",
        okText: "Delete",
        okType: "danger",
        async onOk() {
          await deleteProject(project.id);
          message.success("Project deleted");
        },
      });
    },
    [deleteProject],
  );

  const filtered = search
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-canvas">
      <div className="px-8 pt-10 pb-6 shrink-0 border-b border-hairline">
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={16} className="text-muted" />
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted">Documents / Projects</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="font-display text-[32px] font-normal text-ink tracking-[-0.64px] m-0 leading-tight">
            Projects
          </h1>
          <button
            className="flex items-center gap-2 h-[36px] px-4 rounded-md bg-ink text-canvas font-medium text-[13px] hover:bg-opacity-90 transition-opacity cursor-pointer border-none"
            onClick={handleCreate}
          >
            <Plus size={16} />
            New Project
          </button>
        </div>
        {projects.length > 3 && (
          <div className="mt-6 max-w-[320px]">
            <Input
              prefix={<Search size={14} className="text-muted" />}
              placeholder="Filter by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              className="bg-transparent border-hairline hover:border-hairline-strong focus-within:border-ink shadow-none text-[13px]"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {projectsLoading ? (
          <div className="flex items-center justify-center min-h-[240px] flex-1">
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] flex-1 border border-dashed border-hairline-strong rounded-md bg-transparent m-auto max-w-[600px]">
            <FolderOpen size={32} className="text-muted-soft mb-4" strokeWidth={1.5} />
            <div className="font-mono text-[12px] text-muted-soft uppercase tracking-wide mb-6">
              {search ? "No matches found" : "Directory Empty"}
            </div>
            {!search && (
              <button
                onClick={handleCreate}
                className="bg-transparent border border-hairline-strong text-ink px-4 py-2 rounded-md font-medium text-[13px] hover:border-ink transition-colors cursor-pointer"
              >
                Create First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="flex flex-col gap-4 p-5 border border-hairline rounded-md bg-surface-card cursor-pointer transition-colors duration-150 hover:border-hairline-strong group"
                onClick={() => navigate(`/documents/project/${project.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md border border-hairline-soft bg-canvas text-muted shrink-0">
                    {project.icon || <FolderOpen size={18} strokeWidth={1.5} />}
                  </div>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "edit",
                          icon: <Pencil size={14} />,
                          label: "Edit",
                          onClick: (info) => { info.domEvent.stopPropagation(); handleEdit(project); },
                        },
                        { type: "divider" },
                        {
                          key: "delete",
                          icon: <Trash2 size={14} />,
                          label: "Delete",
                          danger: true,
                          onClick: (info) => { info.domEvent.stopPropagation(); handleDeleteProject(project); },
                        },
                      ],
                    }}
                    trigger={["click"]}
                  >
                    <button
                      className="inline-flex items-center justify-center w-8 h-8 bg-transparent border-none cursor-pointer text-muted-soft rounded-sm p-0 transition-all duration-100 opacity-0 group-hover:opacity-100 hover:text-ink hover:bg-canvas"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </Dropdown>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-ink tracking-tight truncate mb-1">
                    {project.name}
                  </div>
                  <div className="text-[13px] text-muted truncate leading-relaxed min-h-[19px]">
                    {project.description || <span className="text-muted-soft italic">No description</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-hairline-soft pt-4 mt-auto">
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-soft font-mono">
                    <FileText size={12} />
                    {project.documentCount ?? 0} {(project.documentCount ?? 0) === 1 ? "doc" : "docs"}
                  </div>
                  <ChevronRight size={14} className="text-muted-soft shrink-0 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-ink" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProjectModal
        open={modalOpen}
        project={editingProject}
        onClose={() => { setModalOpen(false); setEditingProject(null); }}
        onSaved={(project) => {
          setModalOpen(false);
          setEditingProject(null);
          if (!editingProject) navigate(`/documents/project/${project.id}`);
        }}
      />
    </div>
  );
}

// ── Project Modal (Create / Edit) ─────────────────────────────────────────────

function ProjectModal({ open, project, onClose, onSaved }: {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onSaved: (project: Project) => void;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const createProject = useDocumentsStore((s) => s.createProject);
  const updateProject = useDocumentsStore((s) => s.updateProject);
  const isEdit = !!project;

  useEffect(() => {
    if (open && project) {
      form.setFieldsValue({ name: project.name, description: project.description ?? "" });
    } else if (open) {
      form.resetFields();
    }
  }, [open, project, form]);

  const handleSubmit = async (values: { name: string; description?: string }) => {
    setLoading(true);
    try {
      if (isEdit) {
        const updated = await updateProject(project.id, { name: values.name, description: values.description || null });
        if (updated) { onSaved(updated); message.success("Project updated"); }
      } else {
        const created = await createProject(values.name);
        if (created) { form.resetFields(); onSaved(created); message.success(`Project "${created.name}" created`); }
      }
    } catch {
      message.error(isEdit ? "Failed to update project" : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Configuration" : "New Environment"}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={420}
      className="docs-modal"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} style={{ marginTop: 24 }}>
        <Form.Item
          name="name"
          label={<span className="font-mono text-[11px] text-muted tracking-wide uppercase">Project Name</span>}
          rules={[{ required: true, message: "Required" }]}
        >
          <Input autoFocus placeholder="e.g. CORE_DOCS" className="font-mono text-[13px] bg-canvas border-hairline focus:border-ink rounded-md py-2" />
        </Form.Item>
        <Form.Item name="description" label={<span className="font-mono text-[11px] text-muted tracking-wide uppercase">Description</span>}>
          <Input.TextArea
            placeholder="System architecture details..."
            autoSize={{ minRows: 3, maxRows: 5 }}
            className="text-[13px] bg-canvas border-hairline focus:border-ink rounded-md"
          />
        </Form.Item>
        <div className="flex justify-end gap-3 pt-4 border-t border-hairline mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-hairline text-[13px] font-medium text-ink bg-transparent rounded-md cursor-pointer hover:bg-canvas">Cancel</button>
          <button type="submit" disabled={loading} className="px-5 py-2 border border-transparent text-[13px] font-medium text-canvas bg-ink rounded-md cursor-pointer hover:bg-opacity-90 transition-opacity">
            {isEdit ? "Commit Changes" : "Initialize"}
          </button>
        </div>
      </Form>
    </Modal>
  );
}
