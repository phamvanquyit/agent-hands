import type { HttpClient } from "../http";
import type {
  DatabaseItem,
  CreateDatabaseInput,
  UpdateDatabaseInput,
} from "../types";

export class DatabasesResource {
  constructor(private http: HttpClient) {}

  /** List all databases */
  async list(): Promise<DatabaseItem[]> {
    const res = await this.http.get<{ items: DatabaseItem[]; meta: { total: number } }>("/api/databases");
    return res.items;
  }

  /** Get database by ID */
  async get(id: string): Promise<DatabaseItem> {
    return this.http.get<DatabaseItem>(`/api/databases/${id}`);
  }

  /** Create a new database */
  async create(input: CreateDatabaseInput): Promise<DatabaseItem> {
    return this.http.post<DatabaseItem>("/api/databases", input);
  }

  /** Update database metadata */
  async update(id: string, input: UpdateDatabaseInput): Promise<DatabaseItem> {
    return this.http.patch<DatabaseItem>(`/api/databases/${id}`, input);
  }

  /** Delete database (tables are unlinked, not deleted) */
  async delete(id: string): Promise<void> {
    await this.http.delete(`/api/databases/${id}`);
  }
}
