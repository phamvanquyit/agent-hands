# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.7] - 2025-05-26

### Added

- **Dynamic API** module — create HTTP API endpoints at runtime using JS/TS on Bun
  - Warm instances with ~1-5ms cold start
  - Bindings for accessing internal services (Variables, Tables, Docs, Files)
  - Console capture for all `console.log/error` calls
  - npm dependency support (isolated mode, ~20-50ms cold start)
  - MCP action integration (`dynamic_apis.list`, `dynamic_apis.get`)
- **LLM Providers** module — manage LLM provider configurations
  - CRUD for providers (API key, base URL, model list)
  - Auto-fetch available models from provider API
  - Dynamic configuration system
- Integration tests for Dynamic APIs, LLM Providers, and MQL Query

### Changed

- Improved MCP action registry with Dynamic API actions

## [0.2.5] - 2025-05-05

### Added

- **Storage** module — self-hosted S3-compatible object storage
  - Bucket management (create, list, delete)
  - Object upload/download with streaming
  - Public URLs and presigned URLs (time-limited)
  - S3-compatible API layer (AWS SDK compatible)
  - Access key management
  - File browser Web UI
- **MCP Servers** — built-in MCP server exposing system tools
  - 3 meta-tools: `get_overview`, `get_docs`, `execute`
  - Actions for Variables, Tables, Documents, Storage
  - Streamable HTTP endpoint

### Changed

- Extended API documentation with Storage and MCP endpoints

## [0.2.4] - 2025-04-28

### Added

- **Documents** module — markdown knowledge base
  - Projects as containers for documents
  - Document tree with nested pages
  - Monaco editor for markdown editing
  - MCP actions for document CRUD

## [0.2.3] - 2025-04-22

### Added

- **Dynamic Tables** module — Notion-style databases
  - Database containers with CRUD
  - Tables with custom columns (text, number, date, select, etc.)
  - Row CRUD with sort and filter
  - AG Grid-based data grid UI
  - MQL (Agent Hands Query Language) for table queries
- **Dynamic Variables** module — Redis-like key-value store
  - Namespaces for variable organization
  - Variable CRUD with data types and TTL
  - MCP actions for variable operations

## [0.2.2] - 2025-04-15

### Added

- Initial release
- **User Management** — authentication, RBAC (superadmin/admin/user), session management
- **API Keys** — key generation and management for agent access
- **Auth** — JWT-based authentication with API key support
- CLI entry point (`agent-hands start/stop/restart/status/logs`)
- Install script for one-line installation
- Web UI with React 19 + Ant Design v6 + Tailwind CSS v4

[0.2.7]: https://github.com/Zobite/agent-hands/compare/v0.2.5...v0.2.7
[0.2.5]: https://github.com/Zobite/agent-hands/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/Zobite/agent-hands/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/Zobite/agent-hands/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/Zobite/agent-hands/releases/tag/v0.2.2
