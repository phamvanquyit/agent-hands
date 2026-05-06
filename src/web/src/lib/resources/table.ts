import type { HttpClient } from "../http";
import type {
  DynamicTable,
  DynamicTableRow,
  CreateTableInput,
  UpdateTableInput,
  AddColumnInput,
  UpdateColumnInput,
  ColumnDef,
  CreateRowInput,
  UpdateRowInput,
  RowListQuery,
  RowListResult,
} from "../types";

export class TablesResource {
  constructor(private http: HttpClient) {}

  private basePath(dbId: string) {
    return `/api/databases/${dbId}/tables`;
  }

  // ── Table CRUD ──────────────────────────────────────────────────────────────

  /** List tables in a database */
  async list(databaseId: string): Promise<DynamicTable[]> {
    const res = await this.http.get<{ items: DynamicTable[]; meta: { total: number } }>(this.basePath(databaseId));
    return res.items;
  }

  /** Get table by ID */
  async get(databaseId: string, id: string): Promise<DynamicTable> {
    return this.http.get<DynamicTable>(`${this.basePath(databaseId)}/${id}`);
  }

  /** Create a new table in a database */
  async create(databaseId: string, input: CreateTableInput): Promise<DynamicTable> {
    return this.http.post<DynamicTable>(this.basePath(databaseId), input);
  }

  /** Update table metadata */
  async update(databaseId: string, id: string, input: UpdateTableInput): Promise<DynamicTable> {
    return this.http.patch<DynamicTable>(`${this.basePath(databaseId)}/${id}`, input);
  }

  /** Delete table and all its rows */
  async delete(databaseId: string, id: string): Promise<void> {
    await this.http.delete(`${this.basePath(databaseId)}/${id}`);
  }

  // ── Column Management ────────────────────────────────────────────────────────

  /** List columns of a table */
  async listColumns(databaseId: string, tableId: string): Promise<ColumnDef[]> {
    const res = await this.http.get<{ items: ColumnDef[]; meta: { total: number } }>(`${this.basePath(databaseId)}/${tableId}/columns`);
    return res.items;
  }

  /** Add a column to a table */
  async addColumn(databaseId: string, tableId: string, input: AddColumnInput): Promise<ColumnDef> {
    return this.http.post<ColumnDef>(`${this.basePath(databaseId)}/${tableId}/columns`, input);
  }

  /** Update a column */
  async updateColumn(databaseId: string, tableId: string, colId: string, input: UpdateColumnInput): Promise<ColumnDef> {
    return this.http.patch<ColumnDef>(`${this.basePath(databaseId)}/${tableId}/columns/${colId}`, input);
  }

  /** Delete a column */
  async deleteColumn(databaseId: string, tableId: string, colId: string): Promise<void> {
    await this.http.delete(`${this.basePath(databaseId)}/${tableId}/columns/${colId}`);
  }

  // ── Row CRUD ──────────────────────────────────────────────────────────────────

  /** List rows of a table (paginated, with optional filter/sort) */
  async listRows(databaseId: string, tableId: string, query?: RowListQuery): Promise<RowListResult> {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.sort) params.set("sort", query.sort);
    if (query?.order) params.set("order", query.order);
    if (query?.filter && query.filter.length > 0) {
      params.set("filter", JSON.stringify(query.filter));
    }
    if (query?.filterLogic) params.set("filterLogic", query.filterLogic);
    const qs = params.toString();
    return this.http.get<RowListResult>(`${this.basePath(databaseId)}/${tableId}/rows${qs ? `?${qs}` : ""}`);
  }

  /** Get a single row */
  async getRow(databaseId: string, tableId: string, rowId: string): Promise<DynamicTableRow> {
    return this.http.get<DynamicTableRow>(`${this.basePath(databaseId)}/${tableId}/rows/${rowId}`);
  }

  /** Create a new row */
  async createRow(databaseId: string, tableId: string, input?: CreateRowInput): Promise<DynamicTableRow> {
    return this.http.post<DynamicTableRow>(`${this.basePath(databaseId)}/${tableId}/rows`, input ?? {});
  }

  /** Update a row (merges data) */
  async updateRow(databaseId: string, tableId: string, rowId: string, input: UpdateRowInput): Promise<DynamicTableRow> {
    return this.http.patch<DynamicTableRow>(`${this.basePath(databaseId)}/${tableId}/rows/${rowId}`, input);
  }

  /** Delete a row */
  async deleteRow(databaseId: string, tableId: string, rowId: string): Promise<void> {
    await this.http.delete(`${this.basePath(databaseId)}/${tableId}/rows/${rowId}`);
  }

  /** Bulk delete rows */
  async bulkDeleteRows(databaseId: string, tableId: string, rowIds: string[]): Promise<{ deleted: number }> {
    return this.http.post<{ deleted: number }>(`${this.basePath(databaseId)}/${tableId}/rows/bulk-delete`, { rowIds });
  }

  /** Bulk update rows */
  async bulkUpdateRows(
    databaseId: string,
    tableId: string,
    updates: { rowId: string; data: Record<string, unknown> }[],
  ): Promise<{ updated: number; items: unknown[] }> {
    return this.http.post(`${this.basePath(databaseId)}/${tableId}/rows/bulk-update`, { updates });
  }
}
