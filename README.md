# Moro LLM Toolkit

**Self-hosted infrastructure toolkit for LLM agents and AI applications.**

Moro LLM Toolkit is a self-hosted toolkit that provides all the primitives LLM agents need to operate: state storage, knowledge base, tool execution, file storage, and dynamic APIs — packaged in a single server with a built-in Web UI.

![License](https://img.shields.io/badge/license-MIT-blue)
![Runtime](https://img.shields.io/badge/runtime-Bun-%23f472b6)
![Version](https://img.shields.io/npm/v/moro-llm-toolkit)

---

## Why Moro LLM Toolkit?

When building LLM agents and AI pipelines, you typically need:

- **State storage** — agents need to read/write runtime variables across runs
- **Structured data storage** — tables with custom columns, sort/filter like Notion
- **Document storage** — knowledge base with a block editor for agent retrieval
- **File storage** — object storage for documents, images, artifacts
- **Agent tools** — Python tools running in a sandbox, exposed via MCP protocol
- **Custom HTTP endpoints** — dynamic APIs written in Python at runtime

Instead of integrating multiple separate services (Redis, Notion, S3, custom tool server...), Moro LLM Toolkit bundles everything into **a single self-hosted server**.

---

## Features

| Module | Description |
|---|---|
| 👤 **User Management** | Authentication, RBAC, session management, API key management |
| 🔑 **Dynamic Variables** | Redis-like key-value store with data types, TTL, namespaces |
| 📊 **Dynamic Table** | Notion-style database with custom columns, sort/filter, multiple views |
| 📝 **Documents** | Block-based document editor (Notion-style), organized into Projects |
| 📦 **Storage** | Self-hosted S3-compatible object storage: buckets, upload/download, presigned URLs |
| 🔌 **MCP Servers** | Manage Model Context Protocol servers + Python tools running in a sandbox |
| ⚡ **Dynamic API** | Create HTTP API endpoints at runtime using Python code |

---

## Quick Start

### Prerequisites

[Bun](https://bun.sh/) runtime ≥ 1.2.

```bash
curl -fsSL https://bun.sh/install | bash
```

### Installation

```bash
bun add -g moro-llm-toolkit
```

### Launch

```bash
# Start the server (background daemon)
moro-llm-toolkit start

# Open the Web UI
open http://localhost:18080
```

The Web UI is pre-bundled and served automatically — no additional setup required.

---

## CLI Reference

```
moro-llm-toolkit <command> [options]
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
| `--data-dir <path>`   | `~/.moro-llm-toolkit` | Data directory       |
| `-f, --foreground`    | —                     | Run in foreground    |

**`logs`:**

| Flag                | Default | Description                     |
|---------------------|---------|--------------------------------|
| `--lines <number>`  | `50`    | Number of log lines to display |
| `--follow`          | —       | Tail logs continuously         |

### Examples

```bash
# Start with a custom port
moro-llm-toolkit start --port 8080

# Expose on the local network
moro-llm-toolkit start --host 0.0.0.0

# Run in foreground for debugging
moro-llm-toolkit start --foreground

# View live logs
moro-llm-toolkit logs --follow

# Check status
moro-llm-toolkit status

# Stop the server
moro-llm-toolkit stop
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
> **Change the password immediately after the first login!** The default account has super admin privileges and a very simple password.

### How to Change the Password

**Via Web UI:**

1. Open `http://localhost:18080` and log in with the default credentials above
2. Click on the avatar/account name in the top right corner
3. Select **Profile** or **Account Settings**
4. Enter the old password (`admin123`) and the new password
5. Save

**Via API:**

```bash
# 1. Log in to get a token
TOKEN=$(curl -s -X POST http://localhost:18080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin123"}' \
  | jq -r '.token')

# 2. Change the password
curl -X POST http://localhost:18080/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"old_password":"admin123","new_password":"your-new-secure-password"}'
```

---

## Data Storage

All data is stored in the data directory (`~/.moro-llm-toolkit` by default):

```
~/.moro-llm-toolkit/
├── data.db       # SQLite database (users, variables, tables, MCP configs...)
├── agent.pid     # PID file (daemon mode)
├── agent.log     # Server logs (daemon mode)
└── storage/      # Object storage files (buckets & objects)
```

---

## REST API

The server exposes a REST API at `http://localhost:18080/api`. Full API documentation is available at:

```
http://localhost:18080/docs
```

### Authentication

All API endpoints require authentication via one of two methods:

**Bearer Token** (session-based):
```http
Authorization: Bearer <token>
```

**API Key**:
```http
X-API-Key: <api-key>
```

### Main Endpoint Groups

| Prefix | Description |
|---|---|
| `POST /api/auth/login` | Log in, get token |
| `GET /api/users` | User management |
| `GET /api/variables` | Dynamic Variables CRUD |
| `GET /api/databases` | Dynamic Tables CRUD |
| `GET /api/documents` | Documents & Projects CRUD |
| `GET /api/storage` | Object Storage (buckets, objects) |
| `GET /api/mcp-tool-servers` | MCP Server management |
| `GET /api/api-keys` | API Key management |

> See detailed request/response schemas at `/docs` while the server is running.

---

## Integration with LLM Agents

### Dynamic Variables — Agent State Storage

Agents can read/write state via the Variables API:

```javascript
// Write state
await fetch('http://localhost:18080/api/variables', {
  method: 'POST',
  headers: { 'X-API-Key': 'your-key', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    namespace: 'agent:session-123',
    key: 'current_step',
    value: '3',
    type: 'string',
    ttl: 3600  // Auto-delete after 1 hour
  })
});

// Read state
const res = await fetch('http://localhost:18080/api/variables/agent:session-123/current_step', {
  headers: { 'X-API-Key': 'your-key' }
});
```

### MCP Servers — Tools for Agents

Connect your LLM client (Claude, Cursor, Cline...) to the MCP endpoint:

```
http://localhost:18080/api/mcp-tool-servers/<server-id>/mcp
```

The built-in system server exposes integrated tools (read variables, query tables...). Custom servers allow you to write custom Python tools:

```python
# Example Python tool in Moro MCP Server
def search_knowledge_base(query: str) -> str:
    """Search the knowledge base"""
    # Tool code runs in a sandbox
    results = db.query(query)
    return json.dumps(results)
```

### Dynamic API — Custom HTTP Endpoints

Create HTTP endpoints at runtime without redeploying:

```python
# Endpoint code (Python, sandboxed)
def handle(request):
    data = request.json()
    # Custom processing logic
    return {"result": process(data)}
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | [Bun](https://bun.sh/) ≥ 1.2 |
| **Server** | [Fastify](https://fastify.dev/) + fastify-type-provider-zod |
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS |
| **Database** | SQLite (`bun:sqlite`) + Drizzle ORM |
| **Validation** | Zod |
| **AI SDK** | Vercel AI SDK (`ai`, `@ai-sdk/*`) |

---

## Development

```bash
# Clone the repo
git clone https://github.com/devlangla/moro-llm-toolkit.git
cd moro-llm-toolkit

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
moro-llm-toolkit/
├── src/
│   ├── server/                    # Fastify API server
│   │   └── src/
│   │       ├── modules/           # Feature modules (auto-loaded)
│   │       │   ├── auth/          # Authentication
│   │       │   ├── users/         # User management
│   │       │   ├── variables/     # Dynamic variables
│   │       │   ├── databases/     # Dynamic tables
│   │       │   ├── documents/     # Documents & projects
│   │       │   ├── storage/       # Object storage
│   │       │   ├── s3/            # S3-compatible API layer
│   │       │   ├── mcp-tool-servers/ # MCP server management
│   │       │   ├── api-keys/      # API key management
│   │       │   └── api-docs/      # API documentation endpoint
│   │       └── common/            # Shared infrastructure
│   │           ├── db/            # Drizzle ORM schema & migrations
│   │           ├── auth/          # Auth middleware
│   │           ├── mcp/           # MCP protocol shared logic
│   │           └── utils/         # Utility functions
│   └── web/                       # React frontend (Vite)
├── bin/                           # CLI entry point
├── docs/                          # Feature documentation
│   └── features/                  # Per-feature specs
├── docker/                        # Docker configs
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

## Docker

```bash
# Build image
docker build -t moro-llm-toolkit -f docker/Dockerfile .

# Run with a volume mount for data
docker run -d \
  -p 18080:18080 \
  -v ~/.moro-data:/data \
  -e MORO_DATA_DIR=/data \
  moro-llm-toolkit
```

---

## License

[MIT](LICENSE)
