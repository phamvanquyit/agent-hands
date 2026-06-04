import { Switch } from "antd";
import {
  Code,
  Database,
  HardDrive,
  Monitor,
  Plus,
  Trash2,
  Variable,
  Wrench,
  Zap,
} from "lucide-react";
import type { McpToolItem } from "src/lib/types";

// ── Built-in System Tools (individual tools exposed to AI agents) ────────────

interface BuiltinToolCategory {
  category: string;
  icon: React.ReactNode;
  tools: { name: string; description: string }[];
}

const BUILTIN_TOOLS: BuiltinToolCategory[] = [
  {
    category: "Variables",
    icon: <Variable size={14} strokeWidth={1.5} />,
    tools: [
      { name: "kv_list", description: "List all stored variables with pagination and search" },
      { name: "kv_get", description: "Get one or more variables by key" },
      { name: "kv_set", description: "Create or update (upsert) one or more variables" },
      { name: "kv_delete", description: "Delete one or more variables by key" },
    ],
  },
  {
    category: "DataTables",
    icon: <Database size={14} strokeWidth={1.5} />,
    tools: [
      { name: "datatables_list_projects", description: "List all datatable projects" },
      { name: "datatables_create_project", description: "Create a new datatable project" },
      { name: "datatables_list_tables", description: "List all tables in a project with column definitions" },
      { name: "datatables_create_table", description: "Create a new table with column definitions in a project" },
      { name: "datatables_update_table", description: "Update a table's metadata (name, description)" },
      { name: "datatables_query_rows", description: "Query table rows using MQL (SQL-like syntax)" },
      { name: "datatables_insert_row", description: "Insert a new row into a table" },
      { name: "datatables_update_row", description: "Update an existing row in a table" },
      { name: "datatables_delete_row", description: "Delete a single row from a table" },
    ],
  },
  {
    category: "Storage",
    icon: <HardDrive size={14} strokeWidth={1.5} />,
    tools: [
      { name: "storage_list_buckets", description: "List all storage buckets" },
      { name: "storage_list_objects", description: "List objects (files) in a bucket" },
      { name: "storage_get_object_info", description: "Get metadata for a specific object" },
      { name: "storage_get_download_url", description: "Generate a pre-signed download URL" },
      { name: "storage_upload_object", description: "Upload a file (text or base64) to a bucket" },
      { name: "storage_delete_object", description: "Delete an object from a bucket" },
    ],
  },
  {
    category: "Browser",
    icon: <Monitor size={14} strokeWidth={1.5} />,
    tools: [
      { name: "browser_list", description: "List all browser profiles" },
      { name: "browser_create", description: "Create a new browser profile with fingerprint generation" },
      { name: "browser_start", description: "Launch a browser profile in persistent mode" },
      { name: "browser_stop", description: "Gracefully shut down a running browser" },
      { name: "browser_delete", description: "Delete a browser profile and all saved state" },
      { name: "browser_list_tabs", description: "List all active tabs in a running browser" },
      { name: "browser_run_steps", description: "Execute a sequence of browser actions (batch)" },
      { name: "browser_quick_run", description: "Quick ephemeral browser — run steps without profiles" },
    ],
  },
  {
    category: "Dynamic APIs",
    icon: <Code size={14} strokeWidth={1.5} />,
    tools: [
      { name: "dynamic_api_list", description: "List all dynamic API endpoints" },
      { name: "dynamic_api_get", description: "Get a dynamic API endpoint by ID" },
      { name: "dynamic_api_create", description: "Create a new dynamic API with JavaScript handler" },
      { name: "dynamic_api_update", description: "Update an existing dynamic API endpoint" },
      { name: "dynamic_api_delete", description: "Delete a dynamic API endpoint" },
    ],
  },
];

// ── Tools Tab ─────────────────────────────────────────────────────────────────

export function ToolsTab({
  id,
  isBuiltin,
  tools,
  onToggle,
  onDeleteTool,
  onNewTool,
  navigate,
}: {
  id: string;
  isBuiltin: boolean;
  tools: McpToolItem[];
  onToggle: (t: McpToolItem) => void;
  onDeleteTool: (t: McpToolItem) => void;
  onNewTool: () => void;
  navigate: (path: string) => void;
}) {
  if (!isBuiltin) {
    return (
      <div className="max-w-[800px] mx-auto flex flex-col gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench size={14} className="text-muted" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted">MCP Tools ({tools.length})</span>
            </div>
            <button
              onClick={onNewTool}
              className="inline-flex items-center gap-1.5 h-[32px] px-3.5 rounded-md bg-ink text-canvas font-medium text-[12px] hover:bg-primary-active cursor-pointer transition-colors border-none"
            >
              <Plus size={13} />
              New Tool
            </button>
          </div>

          {tools.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-hairline rounded-md bg-surface-card text-center min-h-[200px]">
              <Wrench size={24} className="text-muted-soft mb-2" strokeWidth={1.5} />
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">No Tools Created Yet</span>
              <p className="text-[12px] text-muted-soft mt-1.5 mb-0 max-w-[320px] leading-relaxed">
                Create custom tools that your AI agents can execute in an isolated JavaScript sandbox.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tools.map((tool, idx) => (
                <div
                  key={tool.id}
                  onClick={() => navigate(`/mcp-servers/${id}/tools/${tool.id}`)}
                  className="flex items-center justify-between px-4 py-3.5 border border-hairline rounded-md bg-surface-card hover:border-hairline-strong transition-all duration-150 ease-in-out cursor-pointer group animate-[fadeInUp_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-canvas border border-hairline-soft text-muted shrink-0">
                      <Wrench size={14} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono text-[13px] text-ink font-medium block truncate group-hover:text-ink transition-colors">{tool.name}</span>
                      <span className="text-[12px] text-muted block truncate mt-0.5">{tool.description}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Switch size="small" checked={!!tool.isActive} onChange={() => onToggle(tool)} />
                    <button
                      onClick={() => onDeleteTool(tool)}
                      className="p-1.5 rounded hover:bg-canvas text-muted hover:text-[#cf2d56] transition-colors cursor-pointer border-none bg-transparent"
                      title="Delete tool"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const totalTools = BUILTIN_TOOLS.reduce((sum, cat) => sum + cat.tools.length, 0);

  return (
    <div className="flex flex-col gap-6 max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-muted" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">System Tools — {totalTools} Exposed to Agents</span>
      </div>

      {/* Grouped tools */}
      {BUILTIN_TOOLS.map((category, catIdx) => (
        <div key={category.category} className="animate-[fadeInUp_0.35s_cubic-bezier(0.16,1,0.3,1)_both]" style={{ animationDelay: `${catIdx * 0.06}s` }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-5 h-5 rounded text-muted">{category.icon}</div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted font-medium">{category.category}</span>
            <span className="font-mono text-[10px] text-muted-soft">({category.tools.length})</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {category.tools.map((tool, idx) => (
              <div
                key={tool.name}
                className="flex items-center justify-between px-4 py-3 border border-hairline rounded-md bg-surface-card hover:border-hairline-strong transition-colors duration-150"
                style={{ animationDelay: `${catIdx * 0.06 + idx * 0.03}s` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-7 h-7 rounded bg-timeline-thinking/10 border border-timeline-thinking/20 text-accent-amber shrink-0">
                    <Wrench size={12} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-[13px] text-ink font-medium">{tool.name}</div>
                    <div className="text-[12px] text-muted mt-0.5">{tool.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
