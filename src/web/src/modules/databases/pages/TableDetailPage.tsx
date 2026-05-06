import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Checkbox,
  message,
  Spin,
  Dropdown,
} from "antd";
import type { InputRef } from "antd";
import {
  Plus,
  Trash2,
  Pencil,
  ArrowLeft,
  AlertTriangle,
  MoreHorizontal,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  ChevronDown,
  Table2,
} from "lucide-react";
import type {
  DynamicTable,
  DynamicTableRow,
  ColumnDef,
  ColumnType,
  AddColumnInput,
  UpdateColumnInput,
} from "src/lib/types";
import { MoroError } from "src/lib/http";
import { client } from "src/lib/client";
// ── Date formatting helper ──────────────────────────────────────────────────────

function formatDate(value: string | number, includeTime?: boolean): string {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const date = d.toISOString().slice(0, 10);
    if (!includeTime) return date;
    const time = d.toTimeString().slice(0, 5);
    return `${date} ${time}`;
  } catch {
    return String(value);
  }
}

const { confirm } = Modal;

// ── Column type icons & labels ──────────────────────────────────────────────────

const COLUMN_TYPE_CONFIG: Record<
  ColumnType,
  { icon: React.ReactNode; label: string; color: string }
> = {
  text: { icon: <Type size={14} />, label: "Text", color: "blue" },
  number: { icon: <Hash size={14} />, label: "Number", color: "green" },
  date: { icon: <Calendar size={14} />, label: "Date", color: "cyan" },
  boolean: { icon: <ToggleLeft size={14} />, label: "Boolean", color: "orange" },
};



// ══════════════════════════════════════════════════════════════════════════════
//  TABLE DETAIL PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function TableDetailPage() {
  const { dbId, id } = useParams<{ dbId: string; id: string }>();
  const navigate = useNavigate();

  const [table, setTable] = useState<DynamicTable | null>(null);
  const [rows, setRows] = useState<DynamicTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Modal states
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [editColumn, setEditColumn] = useState<ColumnDef | null>(null);

  // Editing cell state
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editingValue, setEditingValue] = useState<unknown>(null);

  // New Row modal
  const [addRowOpen, setAddRowOpen] = useState(false);

  // ── Data Fetching ───────────────────────────────────────────────────────────

  const fetchTable = useCallback(async () => {
    if (!dbId || !id) return;
    try {
      const data = await client.tables.get(dbId, id);
      setTable(data);
    } catch {
      message.error("Failed to load table");
      navigate(`/databases/${dbId}`);
    }
  }, [dbId, id, navigate]);

  const fetchRows = useCallback(async () => {
    if (!dbId || !id) return;
    setRowsLoading(true);
    try {
      const result = await client.tables.listRows(dbId, id, {
        page: pagination.page,
        limit: pagination.limit,
      });
      setRows(result.items);
      setPagination((prev) => ({ ...prev, total: result.meta.total }));
    } catch {
      message.error("Failed to load rows");
    } finally {
      setRowsLoading(false);
    }
  }, [dbId, id, pagination.page, pagination.limit]);

  useEffect(() => {
    setLoading(true);
    fetchTable().finally(() => setLoading(false));
  }, [fetchTable]);

  useEffect(() => {
    if (table) fetchRows();
  }, [table, fetchRows]);

  // ── Row Actions ─────────────────────────────────────────────────────────────

  const handleDeleteRow = (rowId: string) => {
    if (!dbId || !id) return;
    confirm({
      title: "Delete this row?",
      icon: <AlertTriangle size={20} style={{ color: "var(--color-error)", marginRight: 8 }} />,
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      async onOk() {
        try {
          await client.tables.deleteRow(dbId!, id!, rowId);
          setRows((prev) => prev.filter((r) => r.id !== rowId));
          setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
          message.success("Row deleted");
        } catch {
          message.error("Failed to delete row");
        }
      },
    });
  };

  const handleBulkDelete = () => {
    if (!dbId || !id || selectedRowIds.length === 0) return;
    confirm({
      title: `Delete ${selectedRowIds.length} row(s)?`,
      icon: <AlertTriangle size={20} style={{ color: "var(--color-error)", marginRight: 8 }} />,
      content: "This action cannot be undone.",
      okText: "Delete All",
      okType: "danger",
      async onOk() {
        try {
          await client.tables.bulkDeleteRows(dbId!, id!, selectedRowIds);
          setRows((prev) => prev.filter((r) => !selectedRowIds.includes(r.id)));
          setPagination((prev) => ({ ...prev, total: prev.total - selectedRowIds.length }));
          setSelectedRowIds([]);
          message.success(`${selectedRowIds.length} row(s) deleted`);
        } catch {
          message.error("Failed to delete rows");
        }
      },
    });
  };

  // ── Cell Editing ──────────────────────────────────────────────────────────

  const handleCellSave = async (rowId: string, colId: string, value: unknown) => {
    if (!dbId || !id) return;
    setEditingCell(null);
    try {
      const updatedRow = await client.tables.updateRow(dbId, id, rowId, {
        data: { [colId]: value },
      });
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? updatedRow : r)),
      );
    } catch {
      message.error("Failed to update cell");
    }
  };

  // ── Column Actions ────────────────────────────────────────────────────────

  const handleDeleteColumn = (col: ColumnDef) => {
    if (!dbId || !id) return;
    confirm({
      title: `Delete column "${col.name}"?`,
      icon: <AlertTriangle size={20} style={{ color: "var(--color-error)", marginRight: 8 }} />,
      content: "This will remove this column and its data from all rows.",
      okText: "Delete",
      okType: "danger",
      async onOk() {
        try {
          await client.tables.deleteColumn(dbId!, id as string, col.id);
          await fetchTable();
          await fetchRows();
          message.success("Column deleted");
        } catch (err) {
          if (err instanceof MoroError) message.error(err.message);
        }
      },
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!table) return null;

  const columns = [...table.columns].sort((a, b) => a.order - b.order);
  const allSelected = rows.length > 0 && selectedRowIds.length === rows.length;

  return (
    <div className="mx-auto px-12 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-hairline">
        <button
          className="flex items-center justify-center w-9 h-9 rounded-md bg-canvas hover:bg-surface-card border border-hairline text-muted transition-colors cursor-pointer"
          onClick={() => navigate(`/databases/${dbId}`)}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3">
            {table.icon ? (
              <span className="text-2xl mt-0.5">{table.icon}</span>
            ) : (
              <Table2 size={24} className="text-ink mt-0.5" strokeWidth={1.5} />
            )}
            <h1 className="font-display text-[26px] md:text-[32px] tracking-tight text-ink m-0 leading-tight truncate">
              {table.name}
            </h1>
          </div>
          {table.description && (
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-soft mt-1.5 truncate">
              {table.description}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {selectedRowIds.length > 0 && (
            <button
              className="flex items-center gap-2 h-[36px] px-4 rounded-md bg-transparent border border-red-500/30 text-red-500 font-medium text-[13px] hover:bg-red-50 transition-colors cursor-pointer"
              onClick={handleBulkDelete}
            >
              <Trash2 size={14} />
              Delete ({selectedRowIds.length})
            </button>
          )}
          <button
            className="flex items-center gap-2 h-[36px] px-4 rounded-md bg-surface-card border border-hairline text-ink font-medium text-[13px] hover:border-hairline-strong transition-colors cursor-pointer shadow-sm shadow-black/5"
            onClick={() => setAddRowOpen(true)}
          >
            <Plus size={14} />
            Insert Row
          </button>
          <button
            className="flex items-center gap-2 h-[36px] px-4 rounded-md bg-ink border border-transparent text-canvas font-medium text-[13px] hover:bg-opacity-90 transition-opacity cursor-pointer shadow-sm shadow-black/10"
            onClick={() => setAddColumnOpen(true)}
          >
            <Plus size={14} />
            Add Column
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          border: "1px solid var(--color-hairline)",
          borderRadius: 12,
          overflow: "auto",
          background: "var(--color-canvas)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: columns.length * 180 + 100,
          }}
        >
          <thead>
            <tr style={{ background: "var(--color-canvas)" }}>
              <th
                style={{
                  width: 44,
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--color-hairline)",
                  textAlign: "center",
                }}
              >
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedRowIds.length > 0 && !allSelected}
                  onChange={(e) => {
                    setSelectedRowIds(e.target.checked ? rows.map((r) => r.id) : []);
                  }}
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.id}
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--color-hairline)",
                    borderRight: "1px solid var(--color-hairline-soft)",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--color-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    minWidth: 160,
                    position: "relative",
                    userSelect: "none",
                  }}
                >
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "edit",
                          icon: <Pencil size={13} />,
                          label: "Edit column",
                          onClick: () => setEditColumn(col),
                        },
                        ...(col.order !== 0
                          ? [
                              { type: "divider" as const },
                              {
                                key: "delete",
                                icon: <Trash2 size={13} />,
                                label: "Delete column",
                                danger: true,
                                onClick: () => handleDeleteColumn(col),
                              },
                            ]
                          : []),
                      ],
                    }}
                    trigger={["click"]}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ display: "inline-flex", color: "var(--color-muted-soft)" }}>
                        {COLUMN_TYPE_CONFIG[col.type]?.icon}
                      </span>
                      <span>{col.name}</span>
                      {col.required && (
                        <span style={{ color: "var(--color-error)", fontSize: 10 }}>*</span>
                      )}
                      <ChevronDown size={12} style={{ marginLeft: "auto", opacity: 0.5 }} />
                    </div>
                  </Dropdown>
                </th>
              ))}
              <th
                style={{
                  width: 60,
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--color-hairline)",
                  textAlign: "center",
                }}
              />
            </tr>
          </thead>
          <tbody>
            {rowsLoading ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  style={{ padding: 40, textAlign: "center" }}
                >
                  <Spin />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  style={{ padding: 40, textAlign: "center", color: "var(--color-muted-soft)" }}
                >
                  No rows yet. Click "New Row" to add data.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: "1px solid var(--color-hairline-soft)",
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--color-surface-soft)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "";
                  }}
                >
                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                    <Checkbox
                      checked={selectedRowIds.includes(row.id)}
                      onChange={(e) => {
                        setSelectedRowIds((prev) =>
                          e.target.checked
                            ? [...prev, row.id]
                            : prev.filter((id) => id !== row.id),
                        );
                      }}
                    />
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      style={{
                        padding: "6px 8px",
                        borderRight: "1px solid var(--color-hairline-soft)",
                        cursor: "text",
                        minWidth: 160,
                      }}
                      onClick={() => {
                        if (editingCell?.rowId === row.id && editingCell?.colId === col.id) return;
                        setEditingCell({ rowId: row.id, colId: col.id });
                        setEditingValue(row.data[col.id] ?? null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (editingCell?.rowId === row.id && editingCell?.colId === col.id) return;
                          setEditingCell({ rowId: row.id, colId: col.id });
                          setEditingValue(row.data[col.id] ?? null);
                        }
                      }}
                    >
                      {editingCell?.rowId === row.id && editingCell?.colId === col.id ? (
                        <CellEditor
                          column={col}
                          value={editingValue}
                          onChange={setEditingValue}
                          onSave={(val) => handleCellSave(row.id, col.id, val)}
                          onCancel={() => setEditingCell(null)}
                        />
                      ) : (
                        <CellDisplay column={col} value={row.data[col.id]} />
                      )}
                    </td>
                  ))}
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: "delete",
                            icon: <Trash2 size={13} />,
                            label: "Delete row",
                            danger: true,
                            onClick: () => handleDeleteRow(row.id),
                          },
                        ],
                      }}
                      trigger={["click"]}
                    >
                      <button className="inline-flex items-center justify-center w-7 h-7 rounded bg-transparent border-none text-muted-soft hover:text-ink hover:bg-canvas cursor-pointer select-none transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                    </Dropdown>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-between items-center mt-6 px-1 border-t border-hairline-soft pt-4">
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted-soft">
            {pagination.total} RECORD{pagination.total !== 1 ? 'S' : ''}
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
              Page {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
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

      {/* Add Row button at bottom */}
      <div className="mt-4 pt-2">
        <button
          className="w-full flex items-center justify-center gap-2 h-[44px] rounded-md bg-transparent border border-dashed border-hairline-strong text-muted font-medium text-[13px] hover:border-ink hover:text-ink transition-colors cursor-pointer"
          onClick={() => setAddRowOpen(true)}
        >
          <Plus size={14} />
          Append Row
        </button>
      </div>

      {/* Modals */}
      <AddRowModal
        open={addRowOpen}
        onClose={() => setAddRowOpen(false)}
        onCreated={(newRow) => {
          setAddRowOpen(false);
          setRows((prev) => [newRow, ...prev]);
          setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
        }}
        tableId={id as string}
        databaseId={dbId as string}
        columns={columns}
      />

      <AddColumnModal
        open={addColumnOpen}
        onClose={() => setAddColumnOpen(false)}
        onCreated={async () => {
          setAddColumnOpen(false);
          await fetchTable();
        }}
        tableId={id as string}
        databaseId={dbId as string}
      />

      <EditColumnModal
        column={editColumn}
        onClose={() => setEditColumn(null)}
        onUpdated={async () => {
          setEditColumn(null);
          await fetchTable();
          await fetchRows();
        }}
        tableId={id as string}
        databaseId={dbId as string}
      />
    </div>
  );
}

// ── Cell Display (read-only) ────────────────────────────────────────────────────

function CellDisplay({ column, value }: { column: ColumnDef; value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="font-mono text-[11px] text-muted-soft opacity-50">—</span>;
  }

  switch (column.type) {
    case "boolean":
      return (
        <Switch checked={Boolean(value)} disabled size="small" />
      );

    case "date":
      return (
        <span className="font-mono text-[12px] text-ink">
          {formatDate(value as string, column.options?.includeTime)}
        </span>
      );

    case "number":
      return (
        <span className="font-mono text-[13px] text-ink font-medium">
          {String(value)}
        </span>
      );

    default:
      return <span className="text-[13px] text-ink">{String(value)}</span>;
  }
}

// ── Cell Editor ─────────────────────────────────────────────────────────────────

function CellEditor({
  column,
  value,
  onChange,
  onSave,
  onCancel,
}: {
  column: ColumnDef;
  value: unknown;
  onChange: (val: unknown) => void;
  onSave: (val: unknown) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    // Auto-focus input on mount
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSave(value);
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  switch (column.type) {
    case "boolean":
      return (
        <Switch
          checked={Boolean(value)}
          onChange={(checked) => onSave(checked)}
          autoFocus
          size="small"
        />
      );

    case "date":
      return (
        <Input
          ref={inputRef}
          autoFocus
          type={column.options?.includeTime ? "datetime-local" : "date"}
          value={
            value
              ? column.options?.includeTime
                ? new Date(value as string).toISOString().slice(0, 16)
                : new Date(value as string).toISOString().slice(0, 10)
              : ""
          }
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
          onBlur={() => onSave(value)}
          onKeyDown={handleKeyDown}
          size="small"
          style={{ width: "100%" }}
        />
      );

    case "number":
      return (
        <InputNumber
          autoFocus
          value={value as number | undefined}
          onChange={(val) => onChange(val)}
          onBlur={() => onSave(value)}
          onKeyDown={handleKeyDown}
          size="small"
          style={{ width: "100%", fontFamily: "var(--font-mono)" }}
        />
      );

    default:
      return (
        <Input
          ref={inputRef}
          autoFocus
          value={value as string | undefined ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onSave(value)}
          onKeyDown={handleKeyDown}
          size="small"
          style={{ width: "100%" }}
        />
      );
  }
}

// ── Add Row Modal ───────────────────────────────────────────────────────────────

function AddRowModal({
  open,
  onClose,
  onCreated,
  tableId,
  databaseId,
  columns,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (row: DynamicTableRow) => void;
  tableId: string;
  databaseId: string;
  columns: ColumnDef[];
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const values = form.getFieldsValue();
    const data: Record<string, unknown> = {};
    for (const col of columns) {
      const val = values[col.id];
      if (val !== undefined && val !== null && val !== "") {
        data[col.id] = col.type === "date" ? new Date(val).toISOString() : val;
      }
    }

    setLoading(true);
    try {
      const newRow = await client.tables.createRow(databaseId, tableId, { data });
      onCreated(newRow);
      form.resetFields();
      message.success("Row added");
    } catch (err) {
      if (err instanceof MoroError) message.error(err.message);
      else message.error("Failed to add row");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="New Row"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={480}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        style={{ marginTop: 16 }}
      >
        {columns.map((col) => (
          <Form.Item key={col.id} name={col.id} label={col.name}>
            {col.type === "number" ? (
              <InputNumber style={{ width: "100%" }} placeholder={`Enter ${col.name}`} />
            ) : col.type === "boolean" ? (
              <Switch />
            ) : col.type === "date" ? (
              <Input type={col.options?.includeTime ? "datetime-local" : "date"} />
            ) : (
              <Input placeholder={`Enter ${col.name}`} />
            )}
          </Form.Item>
        ))}

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
              className="px-4 py-2 bg-ink text-canvas border-none rounded-md font-medium text-[13px] hover:bg-opacity-90 cursor-pointer transition-opacity flex items-center gap-1"
            >
              {loading ? "Executing..." : "Execute"}
            </button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── Add Column Modal ────────────────────────────────────────────────────────────

function AddColumnModal({
  open,
  onClose,
  onCreated,
  tableId,
  databaseId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  tableId: string;
  databaseId: string;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: AddColumnInput) => {
    setLoading(true);
    try {
      await client.tables.addColumn(databaseId, tableId, { name: values.name, type: values.type });
      onCreated();
      form.resetFields();
      message.success("Column added");
    } catch (err) {
      if (err instanceof MoroError) message.error(err.message);
      else message.error("Failed to add column");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Column" open={open} onCancel={onClose} footer={null} destroyOnHidden width={440}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        initialValues={{ type: "text" }}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="name"
          label="Column Name"
          rules={[{ required: true, message: "Name is required" }]}
        >
          <Input autoFocus placeholder="e.g. Status" />
        </Form.Item>

        <Form.Item name="type" label="Type">
          <Select>
            {Object.entries(COLUMN_TYPE_CONFIG).map(([key, config]) => (
              <Select.Option key={key} value={key}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {config.icon} {config.label}
                </span>
              </Select.Option>
            ))}
          </Select>
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
              className="px-4 py-2 bg-ink text-canvas border-none rounded-md font-medium text-[13px] hover:bg-opacity-90 cursor-pointer transition-opacity flex items-center gap-1"
            >
              {loading ? "Executing..." : "Execute"}
            </button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── Edit Column Modal ───────────────────────────────────────────────────────────

function EditColumnModal({
  column,
  onClose,
  onUpdated,
  tableId,
  databaseId,
}: {
  column: ColumnDef | null;
  onClose: () => void;
  onUpdated: () => void;
  tableId: string;
  databaseId: string;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (column) {
      form.setFieldsValue({
        name: column.name,
        type: column.type,
      });
    }
  }, [column, form]);

  const handleSubmit = async (values: UpdateColumnInput) => {
    if (!column) return;
    setLoading(true);
    try {
      await client.tables.updateColumn(databaseId, tableId, column.id, { name: values.name, type: values.type });
      onUpdated();
      message.success("Column updated");
    } catch (err) {
      if (err instanceof MoroError) message.error(err.message);
      else message.error("Failed to update column");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Edit Column — ${column?.name}`}
      open={!!column}
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
          label="Column Name"
          rules={[{ required: true, message: "Name is required" }]}
        >
          <Input autoFocus />
        </Form.Item>

        <Form.Item name="type" label="Type">
          <Select disabled={column?.order === 0}>
            {Object.entries(COLUMN_TYPE_CONFIG).map(([key, config]) => (
              <Select.Option key={key} value={key}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {config.icon} {config.label}
                </span>
              </Select.Option>
            ))}
          </Select>
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
              className="px-4 py-2 bg-ink text-canvas border-none rounded-md font-medium text-[13px] hover:bg-opacity-90 cursor-pointer transition-opacity flex items-center gap-1"
            >
              {loading ? "Executing..." : "Execute"}
            </button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}


