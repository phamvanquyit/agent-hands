import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Modal, Form, message, Spin, Dropdown } from "antd";
import {
  Plus,
  Braces,
  MoreVertical,
  Trash2,
  ChevronRight,
  Search,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import type { VariableNamespace, CreateVariableNamespaceInput, UpdateVariableNamespaceInput } from "src/lib/types";
import { client } from "src/lib/client";

const { confirm } = Modal;

export default function VariablesNamespacesPage() {
  const navigate = useNavigate();
  const [namespaces, setNamespaces] = useState<VariableNamespace[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNamespace, setEditingNamespace] = useState<VariableNamespace | null>(null);
  const [search, setSearch] = useState("");

  const fetchNamespaces = useCallback(async () => {
    setLoading(true);
    try {
      const list = await client.variables.namespaces.list();
      setNamespaces(list);
    } catch {
      message.error("Failed to load namespaces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNamespaces();
  }, [fetchNamespaces]);

  const handleCreate = () => {
    setEditingNamespace(null);
    setModalOpen(true);
  };

  const handleEdit = useCallback((ns: VariableNamespace) => {
    setEditingNamespace(ns);
    setModalOpen(true);
  }, []);

  const handleDeleteNamespace = useCallback(
    (ns: VariableNamespace) => {
      confirm({
        title: <span className="font-mono text-[14px]">Delete Namespace</span>,
        icon: <AlertTriangle size={20} className="text-red-500 mr-2" />,
        content: `Target: ${ns.name}. All variables in this namespace will be purged. This action is irreversible.`,
        okText: "Execute Delete",
        okType: "danger",
        async onOk() {
          try {
            await client.variables.namespaces.delete(ns.id);
            setNamespaces((prev) => prev.filter((p) => p.id !== ns.id));
            message.success("Namespace purged");
          } catch {
            message.error("Failed to delete namespace");
          }
        },
      });
    },
    [],
  );

  const filtered = search
    ? namespaces.filter((ns) => ns.name.toLowerCase().includes(search.toLowerCase()))
    : namespaces;

  const formatDate = (ts: number) => {
    return new Date(ts).toISOString().split("T")[0];
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-canvas">
      {/* Header */}
      <div className="px-8 pt-10 pb-6 shrink-0 border-b border-hairline">
        <div className="flex items-center gap-2 mb-3">
          <Braces size={16} className="text-muted" />
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
            Config / Variable Namespaces
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[32px] font-normal text-ink tracking-[-0.64px] m-0 leading-tight">
              Variable Namespaces
            </h1>
            <p className="text-[13px] text-muted mt-2 m-0 leading-relaxed">
              Select a namespace to manage its key-value store.
            </p>
          </div>
          <button
            className="flex items-center gap-2 h-[36px] px-4 rounded-md bg-ink text-canvas font-medium text-[13px] hover:bg-opacity-90 transition-opacity cursor-pointer border-none shrink-0"
            onClick={handleCreate}
          >
            <Plus size={16} />
            Initialize Namespace
          </button>
        </div>

        {namespaces.length > 3 && (
          <div className="mt-4 max-w-[320px]">
            <Input
              prefix={<Search size={14} style={{ color: "var(--color-muted-soft)" }} />}
              placeholder="Search namespaces…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[240px] flex-1">
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          /* ── Empty State ───────────────────────────── */
          <div className="flex flex-col items-center justify-center min-h-[300px] flex-1 border border-dashed border-hairline-strong rounded-md bg-transparent m-auto max-w-[600px]">
            <Braces size={32} className="text-muted-soft mb-4" strokeWidth={1.5} />
            <div className="font-mono text-[12px] text-muted-soft uppercase tracking-wide mb-6">
              {search ? "NO MATCHING NAMESPACES" : "DIRECTORY EMPTY"}
            </div>
            {!search && (
              <button
                onClick={handleCreate}
                className="bg-transparent border border-hairline-strong text-ink px-4 py-2 rounded-md font-medium text-[13px] hover:border-ink transition-colors cursor-pointer"
              >
                Initialize First Namespace
              </button>
            )}
          </div>
        ) : (
          /* ── Namespace Grid ────────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((ns, idx) => (
              <div
                key={ns.id}
                className="flex flex-col gap-4 p-5 border border-hairline rounded-md bg-surface-card cursor-pointer transition-colors duration-150 ease-in-out hover:border-hairline-strong group opacity-0 animate-[fadeInUp_0.35s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                style={{ animationDelay: `${idx * 0.04}s` }}
                onClick={() => navigate(`/variables/namespace/${ns.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md border border-hairline-soft bg-canvas text-muted shrink-0">
                    {ns.icon || <Braces size={18} strokeWidth={1.5} />}
                  </div>

                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "edit",
                          icon: <Pencil size={14} />,
                          label: <span className="font-mono text-[12px]">Configure</span>,
                          onClick: (info) => {
                            info.domEvent.stopPropagation();
                            handleEdit(ns);
                          },
                        },
                        { type: "divider" },
                        {
                          key: "delete",
                          icon: <Trash2 size={14} />,
                          label: <span className="font-mono text-[12px]">Delete</span>,
                          danger: true,
                          onClick: (info) => {
                            info.domEvent.stopPropagation();
                            handleDeleteNamespace(ns);
                          },
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
                  <div className="text-[15px] font-medium text-ink tracking-tight whitespace-nowrap overflow-hidden text-ellipsis mb-1">
                    {ns.name}
                  </div>
                  <div className="text-[13px] text-muted whitespace-nowrap overflow-hidden text-ellipsis leading-relaxed min-h-[19px]">
                    {ns.description || "—"}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-hairline-soft pt-4 mt-auto">
                  <span className="font-mono text-[10px] text-muted-soft tracking-wider uppercase">
                    {formatDate(ns.updatedAt)}
                  </span>
                  <ChevronRight size={14} className="text-muted-soft shrink-0 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-ink" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NamespaceModal
        open={modalOpen}
        namespace={editingNamespace}
        onClose={() => {
          setModalOpen(false);
          setEditingNamespace(null);
        }}
        onSaved={(ns) => {
          setModalOpen(false);
          setEditingNamespace(null);
          fetchNamespaces();
          if (!editingNamespace) {
            navigate(`/variables/namespace/${ns.id}`);
          }
        }}
      />
    </div>
  );
}

// ── Namespace Modal (Create / Edit) ─────────────────────────────────────────────

function NamespaceModal({
  open,
  namespace: ns,
  onClose,
  onSaved,
}: {
  open: boolean;
  namespace: VariableNamespace | null;
  onClose: () => void;
  onSaved: (ns: VariableNamespace) => void;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isEdit = !!ns;

  useEffect(() => {
    if (open && ns) {
      form.setFieldsValue({
        name: ns.name,
        description: ns.description ?? "",
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, ns, form]);

  const handleSubmit = async (values: { name: string; description?: string }) => {
    setLoading(true);
    try {
      if (isEdit) {
        const input: UpdateVariableNamespaceInput = {
          name: values.name,
          description: values.description || null,
        };
        const updated = await client.variables.namespaces.update(ns.id, input);
        onSaved(updated);
        message.success("Namespace configured");
      } else {
        const input: CreateVariableNamespaceInput = {
          name: values.name,
          description: values.description,
        };
        const created = await client.variables.namespaces.create(input);
        form.resetFields();
        onSaved(created);
        message.success(`Namespace "${created.name}" initialized`);
      }
    } catch {
      message.error(isEdit ? "Failed to update namespace" : "Failed to initialize namespace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span className="font-mono text-[14px]">
          {isEdit ? "Configure Namespace" : "Initialize Namespace"}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={440}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="name"
          label="Identifier"
          rules={[{ required: true, message: "Namespace identifier is required" }]}
        >
          <Input
            autoFocus
            placeholder="e.g. production-config, staging-env"
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea
            placeholder="Optional description…"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent border border-hairline rounded-md text-ink font-medium text-[13px] hover:bg-canvas cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-ink text-canvas border-none rounded-md font-medium text-[13px] hover:bg-opacity-90 cursor-pointer transition-opacity disabled:opacity-50"
            >
              {loading ? "Executing..." : "Execute"}
            </button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
