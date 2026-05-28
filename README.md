# Agent Hands

**Self-hosted infrastructure toolkit for LLM agents and AI applications.**

Agent Hands provides all the building blocks LLM agents need to operate — state storage, structured data, file storage, tool execution, and dynamic APIs — packaged in a single server with a built-in Web UI.

![License](https://img.shields.io/badge/license-MIT-blue)
![Runtime](https://img.shields.io/badge/runtime-Bun-%23f472b6)
![Version](https://img.shields.io/badge/version-0.2.7-green)

---

## Why Agent Hands?

When building LLM agents and AI pipelines, you typically need:

- **State storage** — agents need to read/write runtime variables across runs
- **Structured data** — tables with custom columns, sort/filter like Notion databases
- **File storage** — self-hosted object storage for documents, images, artifacts
- **Agent tools** — system tools exposed via MCP protocol for AI clients
- **Custom HTTP endpoints** — dynamic APIs written in JS/TS, created at runtime

Instead of integrating multiple separate services (Redis, Notion, S3, custom tool server...), Agent Hands bundles everything into **a single self-hosted server**.

---

## Features

### ✅ Implemented

| Module | Description | Status |
|---|---|---|
| 👤 **User Management** | Authentication, RBAC (superadmin/admin/user), session management, API keys | ✅ Done |
| 🔑 **Dynamic Variables** | Redis-like key-value store with data types, TTL, namespaces | ✅ Done |
| 📊 **Dynamic Tables** | Notion-style databases with custom columns, sort/filter, row CRUD | ✅ Done |

| 📦 **Storage** | Self-hosted S3-compatible object storage: buckets, upload/download, presigned URLs, access keys | ✅ Done |
| 🔌 **Built-in MCP Server** | System MCP server exposing Variables, Tables, Storage as tools for AI agents | ✅ Done |
| ⚡ **Dynamic API** | Create HTTP API endpoints at runtime using JS/TS code on Bun runtime | ✅ Done |

### 🚧 In Progress / Planned

| Module | Description | Status |
|---|---|---|
| 🔌 **Custom MCP Servers** | User-defined MCP servers with custom Python tools in sandbox | ⬜ Planned |
| 📊 **Table Views** | Multiple views (Table/Board/List) for Dynamic Tables | ⬜ Planned |
| 📊 **Row Detail Dialog** | Detailed row view in Dynamic Tables | ⬜ Planned |

---

## Quick Start

### Prerequisites

[Bun](https://bun.sh/) runtime ≥ 1.2.

```bash
curl -fsSL https://bun.sh/install | bash
```

### Installation

```bash
curl -fsSL https://raw.githubusercontent.com/Zobite/agent-hands/main/install.sh | bash
```

Or install a specific version:

```bash
VERSION=0.2.7 curl -fsSL https://raw.githubusercontent.com/Zobite/agent-hands/main/install.sh | bash
```

### Launch

```bash
# Start the server (background daemon)
agent-hands start

# Open the Web UI
open http://localhost:18080
```

The Web UI is pre-bundled and served automatically — no additional setup required.

### Uninstall

```bash
rm -rf ~/.local/share/agent-hands
sudo rm /usr/local/bin/agent-hands
```

---

## CLI Reference

```
agent-hands <command> [options]
```

### Commands

| Command     | Description                         |
|-------------|-------------------------------------|
| `start`     | Start the server (daemon mode)      |
| `stop`      | Stop the running server             |
| `restart`   | Restart the server                  |
| `status`    | Check server status                 |
| `logs`      | View server logs                    |
| `version`   | Print version                       |
| `help`      | Show help                           |

### Options

**`start` / `restart`:**

| Flag                  | Default               | Description          |
|-----------------------|-----------------------|----------------------|
| `--port <number>`     | `18080`               | Server port          |
| `--host <string>`     | `127.0.0.1`           | Server host          |
| `--data-dir <path>`   | `~/.agent-hands` | Data directory       |
| `-f, --foreground`    | —                     | Run in foreground    |

**`logs`:**

| Flag                | Default | Description                     |
|---------------------|---------|---------------------------------|
| `--lines <number>`  | `50`    | Number of log lines to display |
| `--follow`          | —       | Tail logs continuously         |

### Examples

```bash
# Start with a custom port
agent-hands start --port 8080

# Expose on the local network
agent-hands start --host 0.0.0.0

# Run in foreground for debugging
agent-hands start --foreground

# View live logs
agent-hands logs --follow

# Check status
agent-hands status

# Stop the server
agent-hands stop
```

---

## First Login

On first startup when no accounts exist, the server automatically creates a default super admin account:

| Field    | Value             |
|----------|-------------------|
| Username | `admin`           |
| Email    | `admin@local.com` |
| Password | `admin123`        |

> [!WARNING]
> **Change the password immediately after the first login!** The default account has super admin privileges.

---

## Data Storage

All data is stored in the data directory (`~/.agent-hands` by default):

```
~/.agent-hands/
├── data.db       # SQLite database (users, variables, tables, documents, configs...)
├── agent.pid     # PID file (daemon mode)
├── agent.log     # Server logs (daemon mode)
└── storage/      # Object storage files (buckets & objects)
```

---

## REST API

The server exposes a REST API at `http://localhost:18080/api`. Full interactive API documentation is available at:

```
http://localhost:18080/docs
```

### Authentication

All API endpoints require authentication via one of two methods:

**Bearer Token** (session-based):
```http
Authorization: Bearer <token>
```

**API Key** (recommended for agents):
```http
X-API-Key: ltk_xxxxxxxxxxxx
```

### API Endpoint Groups

| Prefix | Description |
|---|---|
| `POST /api/auth/login` | Authenticate, get JWT token |
| `/api/users` | User management (admin+) |
| `/api/api-keys` | API Key management (admin+) |
| `/api/variable-namespaces` | Variable namespaces CRUD |
| `/api/variable-namespaces/:nsId/variables` | Variables CRUD (within a namespace) |
| `/api/databases` | Database containers CRUD |
| `/api/databases/:dbId/tables` | Tables, columns, rows CRUD |

| `/api/storage/buckets` | Bucket management |
| `/api/storage/buckets/:name/objects` | Object upload/download/delete |
| `/api/storage/buckets/:name/presigned` | Generate presigned URLs |
| `/api/mcp/:serverId` | MCP server endpoint (Streamable HTTP) |
| `/api/dynamic-apis` | Dynamic API endpoint management |
| `/apis/*` | Dynamic API request routing |
| `/s3/` | S3-compatible API (AWS SDK compatible) |

> See detailed request/response schemas at `/docs` while the server is running.

---

## Integration with LLM Agents

### 🔑 Dynamic Variables — Agent State Storage

Agents can persist and read state via the Variables API. Variables are organized into **namespaces**.

```javascript
// Create a namespace
const ns = await fetch('http://localhost:18080/api/variable-namespaces', {
  method: 'POST',
  headers: { 'X-API-Key': 'ltk_your-key', 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'agent-session-123', description: 'Session state' })
}).then(r => r.json());

// Write a variable (with optional TTL)
await fetch(`http://localhost:18080/api/variable-namespaces/${ns.id}/variables`, {
  method: 'POST',
  headers: { 'X-API-Key': 'ltk_your-key', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: 'current_step',
    value: '3',
    type: 'string',
    ttl: 3600  // auto-delete after 1 hour
  })
});

// Read a variable by key
const variable = await fetch(
  `http://localhost:18080/api/variable-namespaces/${ns.id}/variables/by-key/current_step`,
  { headers: { 'X-API-Key': 'ltk_your-key' } }
).then(r => r.json());
```

### 🔌 Built-in MCP Server — Tools for AI Agents

The built-in MCP server exposes the entire system to AI agents via 3 meta-tools:

| Tool | Description |
|---|---|
| `get_overview` | List all available actions across all modules |
| `get_docs` | Get detailed documentation for a specific action |
| `execute` | Execute any action with a payload |

**Available actions:**

- **Variables**: `variables.list`, `variables.get`, `variables.set`, `variables.delete`
- **Variable Namespaces**: `variable_namespaces.list`, `variable_namespaces.create`, `variable_namespaces.update`, `variable_namespaces.delete`
- **Databases & Tables**: `databases.list`, `tables.list`, `tables.query`, `tables.insert`, `tables.update`, `tables.delete`

- **Storage**: `storage.list_buckets`, `storage.list_objects`, `storage.get_object_info`, `storage.get_download_url`, `storage.delete_object`

**Connect your AI client** to:

```
http://localhost:18080/api/mcp/<server-id>
```

**Configuration examples:**

<details>
<summary>Claude Code</summary>

```json
{
  "mcpServers": {
    "agent-hands": {
      "type": "streamableHttp",
      "url": "http://localhost:18080/api/mcp/<server-id>",
      "headers": {
        "Authorization": "Bearer ltk_your-api-key"
      }
    }
  }
}
```
</details>

<details>
<summary>Cursor</summary>

```json
{
  "mcpServers": {
    "agent-hands": {
      "url": "http://localhost:18080/api/mcp/<server-id>",
      "headers": {
        "Authorization": "Bearer ltk_your-api-key"
      }
    }
  }
}
```
</details>

### ⚡ Dynamic API — Custom HTTP Endpoints

Create HTTP endpoints at runtime using JavaScript/TypeScript. Code runs on Bun runtime with Cloudflare Workers-inspired architecture:

- **Warm instances** — handlers cached in memory, ~1-5ms cold start
- **Bindings** — access internal services (Variables, Tables, Docs, Files) via injected `context`
- **Console capture** — all `console.log/error` captured and stored as logs
- **npm dependencies** — endpoints can use external npm packages (isolated mode, ~20-50ms cold start)

Dynamic API endpoints are accessible at `/apis/*`:

```
POST http://localhost:18080/apis/my-endpoint
```

### 📦 Storage — S3-Compatible Object Storage

Use the REST API or any S3-compatible client/SDK:

```bash
# Using AWS CLI with Agent Hands Storage
aws s3 ls --endpoint-url http://localhost:18080/s3 \
  --region us-east-1
```

Features: buckets, upload/download, public URLs, presigned URLs (time-limited), access key management.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | [Bun](https://bun.sh/) ≥ 1.2 |
| **Server** | [Fastify](https://fastify.dev/) + fastify-type-provider-zod |
| **Database** | SQLite (`bun:sqlite`) + [Drizzle ORM](https://orm.drizzle.team/) |
| **Validation** | [Zod](https://zod.dev/) |
| **MCP** | [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) |
| **Frontend** | React 19 + TypeScript + [Vite](https://vite.dev/) |
| **UI Components** | [Ant Design](https://ant.design/) v6 + [Tailwind CSS](https://tailwindcss.com/) v4 |
| **Data Grid** | [AG Grid](https://www.ag-grid.com/) |
| **Code Editor** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| **State Management** | [Zustand](https://zustand.docs.pmnd.rs/) |

---

## Development

```bash
# Clone the repo
git clone https://github.com/Zobite/agent-hands.git
cd agent-hands

# Install dependencies
bun install

# Start dev servers (API + Vite HMR running in parallel)
bun run dev

# Type check
bun run typecheck:server
bun run typecheck:web

# Lint & format
bun run biome:check
```

### Project Structure

```
agent-hands/
├── src/
│   ├── server/                    # Fastify API server
│   │   └── src/
│   │       ├── modules/           # Feature modules (auto-loaded)
│   │       │   ├── auth/          # Authentication (login/logout)
│   │       │   ├── users/         # User management
│   │       │   ├── api-keys/      # API key management
│   │       │   ├── variables/     # Dynamic variables + namespaces
│   │       │   ├── databases/     # Dynamic tables (databases/tables/columns/rows)
│   │       │   ├── documents/     # Documents & projects
│   │       │   ├── storage/       # Object storage (buckets/objects)
│   │       │   ├── s3/            # S3-compatible API layer
│   │       │   ├── mcp-tool-servers/ # MCP server management
│   │       │   ├── dynamic-apis/  # Dynamic API endpoints
│   │       │   ├── system/        # System info
│   │       │   └── api-docs/      # API documentation endpoint
│   │       └── common/            # Shared infrastructure
│   │           ├── db/            # Drizzle ORM schema & migrations
│   │           ├── auth/          # Auth middleware (JWT + API key)
│   │           ├── mcp/           # MCP protocol + action registry
│   │           └── utils/         # Utility functions
│   └── web/                       # React frontend (Vite)
│       └── src/
│           └── modules/           # Feature modules (mirror of server)
├── bin/                           # CLI entry point
├── docs/                          # Feature documentation & specs
└── public/                        # Bundled web assets (production)
```

### Adding a New Module

Each feature is an independent module. Create a directory in `src/server/src/modules/<name>/` with 4 files:

```
src/server/src/modules/my-feature/
├── my-feature.module.ts      # Fastify plugin + MODULE_PREFIX export
├── my-feature.controller.ts  # Route handlers (thin layer)
├── my-feature.service.ts     # Business logic + Drizzle queries
└── my-feature.schema.ts      # Zod schemas
```

Modules are auto-loaded — no need to modify `app.ts`.

---

## License

[MIT](LICENSE)
