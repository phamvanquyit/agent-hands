import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Spin,
} from "antd";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, CellValueChangedEvent, GridReadyEvent, GridApi } from "ag-grid-community";
import { themeQuartz } from "ag-grid-community";
import {
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  ChevronLeft,
  Braces,
} from "lucide-react";
import type {
  Variable,
  CreateVariableInput,
  VariableNamespace,
} from "src/lib/types";
import { MoroError } from "src/lib/http";
import { client } from "src/lib/client";

const { confirm } = Modal;

// ── AG Grid custom theme based on Moro design tokens ──
const moroTheme = themeQuartz.withParams({
  accentColor: "#26251e",
  backgroundColor: "#ffffff",
  foregroundColor: "#26251e",
  borderColor: "#e6e5e0",
  chromeBackgroundColor: "#fafaf7",
  headerBackgroundColor: "#fafaf7",
  headerTextColor: "#807d72",
  headerFontSize: 11,
  rowHoverColor: "#f7f7f4",
  selectedRowBackgroundColor: "#f0efeb",
  cellHorizontalPaddingScale: 1,
  fontSize: 13,
  fontFamily: "'Inter', system-ui, sans-serif",
  borderRadius: 0,
  wrapperBorderRadius: 0,
  spacing: 6,
});

function formatTTL(expiresAt: number | null): string {
  if (!expiresAt) return "No expiry";
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return "Expired";
  const secs = Math.floor(remaining / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
  return `${Math.floor(secs / 86400)}d ${Math.floor((secs % 86400) / 3600)}h`;
}

// ══════════════════════════════════════════════════════════════════════════════
//  VARIABLES PAGE (Namespace-scoped)
// ══════════════════════════════════════════════════════════════════════════════

export default function VariablesPage() {
  const { namespaceId } = useParams<{ namespaceId: string }>();
  const navigate = useNavigate();
  const [namespace, setNamespace] = useState<VariableNamespace | null>(null);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

  // Grid
  const gridRef = useRef<AgGridReact>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch namespace info
  useEffect(() => {
    if (!namespaceId) return;
    client.variables.namespaces.get(namespaceId).then(setNamespace).catch(() => {
      message.error("Namespace not found");
      navigate("/variables");
    });
  }, [namespaceId, navigate]);

  // Fetch variables
  const fetchVariables = useCallback(async () => {
    if (!namespaceId) return;
    setLoading(true);
    try {
      const result = await client.variables.list(namespaceId, {
        search: debouncedSearch || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setVariables(result.items);
      setPagination((prev) => ({ ...prev, total: result.meta.total }));
    } catch {
      message.error("Failed to load variables");
    } finally {
      setLoading(false);
    }
  }, [namespaceId, debouncedSearch, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchVariables();
  }, [fetchVariables]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleBulkDelete = () => {
    if (selectedIds.length === 0 || !namespaceId) return;
    confirm({
      title: <span className="font-mono text-[14px]">Purge Records</span>,
      icon: <AlertTriangle size={20} className="text-red-500 mr-2" />,
      content: `${selectedIds.length} variable(s) will be permanently deleted. This action is irreversible.`,
      okText: "Execute Purge",
      okType: "danger",
      async onOk() {
        try {
          await Promise.all(selectedIds.map((id) => client.variables.delete(namespaceId, id)));
          setVariables((prev) => prev.filter((v) => !selectedIds.includes(v.id)));
          setSelectedIds([]);
          message.success(`${selectedIds.length} variable(s) purged`);
        } catch (err) {
          if (err instanceof MoroError) message.error(err.message);
        }
      },
    });
  };

  // ── AG Grid Callbacks ─────────────────────────────────────────────────────────

  const onGridReady = useCallback((event: GridReadyEvent) => {
    gridApiRef.current = event.api;
  }, []);

  const onSelectionChanged = useCallback(() => {
    if (!gridApiRef.current) return;
    const selectedNodes = gridApiRef.current.getSelectedNodes();
    setSelectedIds(selectedNodes.map((n) => n.data.id));
  }, []);

  const onCellValueChanged = useCallback(async (event: CellValueChangedEvent) => {
    if (!namespaceId) return;
    const { id, type, ttl } = event.data;
    const colId = event.colDef.field;
    if (colId === "value") {
      const newValue = String(event.newValue);

      try {
        await client.variables.update(namespaceId, id, {
          value: newValue,
          type,
          ttl: ttl ?? null,
        });
        message.success("Variable updated");
      } catch {
        message.error("Failed to update variable");
        // Revert on failure
        event.node.setDataValue("value", event.oldValue);
      }
    }
  }, [namespaceId]);

  // ── Grid Columns ──────────────────────────────────────────────────────────────

  const agColDefs: ColDef[] = useMemo(() => [
    {
      field: "key",
      headerName: "KEY",
      checkboxSelection: true,
      headerCheckboxSelection: true,
      minWidth: 200,
      editable: false,
      valueFormatter: (params) => String(params.value),
    },
    {
      field: "value",
      headerName: "VALUE",
      flex: 1,
      minWidth: 200,
      editable: true,
      cellEditor: "agLargeTextCellEditor",
      cellEditorPopup: true,
    },
    {
      field: "ttl",
      headerName: "TTL",
      width: 140,
      editable: false,
      valueGetter: (params) => {
        if (!params.data.expiresAt) return "—";
        return formatTTL(params.data.expiresAt);
      },
    },
  ], []);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!namespaceId) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-canvas">
      {/* Header */}
      <div className="px-8 pt-10 pb-6 shrink-0 border-b border-hairline">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/variables")}
          className="flex items-center gap-1 mb-3 bg-transparent border-none cursor-pointer p-0 font-mono text-[11px] uppercase tracking-wide text-muted hover:text-ink transition-colors"
        >
          <ChevronLeft size={14} />
          <Braces size={14} className="mr-1" />
          Variable Namespaces
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[32px] font-normal text-ink tracking-[-0.64px] m-0 leading-tight">
              {namespace?.name ?? <Spin size="small" />}
            </h1>
            {namespace?.description && (
              <p className="text-[13px] text-muted mt-1 m-0 leading-relaxed">
                {namespace.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 h-[36px] px-4 rounded-md bg-transparent border border-hairline-strong font-medium text-[13px] cursor-pointer transition-colors hover:border-ink"
                style={{ color: "var(--color-error)" }}
              >
                <Trash2 size={14} />
                Purge ({selectedIds.length})
              </button>
            )}
            <button
              className="flex items-center gap-2 h-[36px] px-4 rounded-md bg-ink text-canvas font-medium text-[13px] hover:bg-opacity-90 transition-opacity cursor-pointer border-none"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={16} />
              Add Variable
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-8 py-4 shrink-0">
        <Input
          placeholder="Search by key…"
          prefix={<Search size={14} style={{ color: "var(--color-muted-soft)" }} />}
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          style={{ maxWidth: 320 }}
          allowClear
        />
      </div>

      {/* Grid */}
      <div className="flex-1 mx-8 mb-0" style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--color-hairline)" }}>
        {loading && variables.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Spin size="large" />
          </div>
        ) : (
          <div className="h-full w-full ag-theme-moro">
            <AgGridReact
              ref={gridRef}
              theme={moroTheme}
              rowData={variables}
              columnDefs={agColDefs}
              getRowId={(params) => params.data.id}
              rowSelection="multiple"
              suppressRowClickSelection
              onGridReady={onGridReady}
              onSelectionChanged={onSelectionChanged}
              onCellValueChanged={onCellValueChanged}
              animateRows
              undoRedoCellEditing
              stopEditingWhenCellsLoseFocus
              defaultColDef={{
                resizable: true,
                sortable: true,
              }}
              rowHeight={36}
              headerHeight={34}
            />
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex justify-between items-center px-8 py-4 shrink-0">
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted-soft">
            {pagination.total} RECORD{pagination.total !== 1 ? "S" : ""}
          </span>
          <div className="flex items-center gap-4">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="font-mono text-[11px] uppercase tracking-wide text-ink cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-transparent border-none p-0 hover:underline"
            >
              Previous
            </button>
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-soft">
              Page {pagination.page} / {Math.ceil(pagination.total / pagination.limit) || 1}
            </span>
            <button
              disabled={pagination.page * pagination.limit >= pagination.total}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="font-mono text-[11px] uppercase tracking-wide text-ink cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-transparent border-none p-0 hover:underline"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <CreateVariableModal
        namespaceId={namespaceId}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          setCreateModalOpen(false);
          fetchVariables();
        }}
      />
    </div>
  );
}

// ── Create Variable Modal ───────────────────────────────────────────────────────

function CreateVariableModal({
  namespaceId,
  open,
  onClose,
  onCreated,
}: {
  namespaceId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [enableTtl, setEnableTtl] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const input: CreateVariableInput = {
        key: values.key,
        value: values.value,
        type: "string",
        ttl: enableTtl ? values.ttl : undefined,
      };
      await client.variables.create(namespaceId, input);
      onCreated();
      form.resetFields();
      setEnableTtl(false);
      message.success("Variable registered");
    } catch (err) {
      if (err instanceof MoroError) {
        message.error(err.message);
      } else {
        message.error("Failed to register variable");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span className="font-mono text-[14px]">Register Variable</span>}
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
          name="key"
          label="Key"
          rules={[
            { required: true, message: "Key is required" },
            { max: 255, message: "Max 255 characters" },
            { pattern: /^[a-zA-Z0-9._-]+$/, message: "Only alphanumeric, dots, hyphens, underscores" },
          ]}
        >
          <Input
            autoFocus
            placeholder="my.config.key"
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </Form.Item>

        <Form.Item
          name="value"
          label="Value"
          rules={[{ required: true, message: "Value is required" }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Enter value"
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </Form.Item>

        <div className="flex items-center gap-3 mb-5">
          <Switch
            checked={enableTtl}
            onChange={(checked) => setEnableTtl(checked)}
            size="small"
          />
          <span className="text-[13px] text-muted">Set TTL (auto-expire)</span>
          {enableTtl && (
            <Form.Item name="ttl" noStyle rules={[{ required: enableTtl }]}>
              <InputNumber
                min={1}
                placeholder="seconds"
                addonAfter="sec"
                style={{ width: 160 }}
              />
            </Form.Item>
          )}
        </div>

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
              {loading ? "Registering..." : "Execute"}
            </button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
