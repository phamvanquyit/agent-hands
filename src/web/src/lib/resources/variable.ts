import type { HttpClient } from "../http";
import type {
  Variable,
  CreateVariableInput,
  UpdateVariableInput,
  VariableListResult,
  VariableListQuery,
  VariableNamespace,
  CreateVariableNamespaceInput,
  UpdateVariableNamespaceInput,
} from "../types";

// ── Nested: Variable Namespaces ─────────────────────────────────────────────────

class VariableNamespacesSub {
  constructor(private http: HttpClient) {}

  /** List all variable namespaces */
  async list(): Promise<VariableNamespace[]> {
    const res = await this.http.get<{ items: VariableNamespace[]; meta: { total: number } }>("/api/variable-namespaces");
    return res.items;
  }

  /** Get variable namespace by ID */
  async get(id: string): Promise<VariableNamespace> {
    return this.http.get<VariableNamespace>(`/api/variable-namespaces/${id}`);
  }

  /** Create a new variable namespace */
  async create(input: CreateVariableNamespaceInput): Promise<VariableNamespace> {
    return this.http.post<VariableNamespace>("/api/variable-namespaces", input);
  }

  /** Update variable namespace */
  async update(id: string, input: UpdateVariableNamespaceInput): Promise<VariableNamespace> {
    return this.http.patch<VariableNamespace>(`/api/variable-namespaces/${id}`, input);
  }

  /** Delete variable namespace */
  async delete(id: string): Promise<void> {
    await this.http.delete(`/api/variable-namespaces/${id}`);
  }
}

// ── Main: Variables Resource ────────────────────────────────────────────────────

export class VariablesResource {
  /** Sub-resource: manage variable namespaces */
  public readonly namespaces: VariableNamespacesSub;

  /** @deprecated Use .namespaces instead */
  public readonly projects: VariableNamespacesSub;

  constructor(private http: HttpClient) {
    this.namespaces = new VariableNamespacesSub(http);
    this.projects = this.namespaces; // backward compat
  }

  /** Build the base URL for namespace-scoped variables */
  private basePath(namespaceId: string): string {
    return `/api/variable-namespaces/${namespaceId}/variables`;
  }

  /** List variables with optional filters (scoped to a namespace) */
  async list(namespaceId: string, query?: VariableListQuery): Promise<VariableListResult> {
    const params = new URLSearchParams();
    if (query?.search) params.set("search", query.search);
    if (query?.sort) params.set("sort", query.sort);
    if (query?.order) params.set("order", query.order);
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return this.http.get<VariableListResult>(`${this.basePath(namespaceId)}${qs ? `?${qs}` : ""}`);
  }

  /** Get variable by ID */
  async get(namespaceId: string, id: string): Promise<Variable> {
    return this.http.get<Variable>(`${this.basePath(namespaceId)}/${id}`);
  }

  /** Get variable by key */
  async getByKey(namespaceId: string, key: string): Promise<Variable> {
    return this.http.get<Variable>(`${this.basePath(namespaceId)}/by-key/${key}`);
  }

  /** Create or upsert a variable */
  async create(namespaceId: string, input: CreateVariableInput): Promise<Variable> {
    return this.http.post<Variable>(this.basePath(namespaceId), input);
  }

  /** Bulk create/upsert variables */
  async bulkCreate(namespaceId: string, variables: CreateVariableInput[]): Promise<Variable[]> {
    const res = await this.http.post<{ items: Variable[]; meta: { total: number } }>(`${this.basePath(namespaceId)}/bulk`, { variables });
    return res.items;
  }

  /** Update a variable */
  async update(namespaceId: string, id: string, input: UpdateVariableInput): Promise<Variable> {
    return this.http.patch<Variable>(`${this.basePath(namespaceId)}/${id}`, input);
  }

  /** Delete a variable */
  async delete(namespaceId: string, id: string): Promise<void> {
    await this.http.delete(`${this.basePath(namespaceId)}/${id}`);
  }

  /** Flush all variables in a namespace */
  async flushNamespace(namespaceId: string): Promise<{ deleted: number }> {
    return this.http.delete<{ deleted: number }>(this.basePath(namespaceId));
  }
}
