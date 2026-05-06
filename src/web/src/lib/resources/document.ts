import type { HttpClient } from "../http";
import type {
  DocumentDetail,
  DocumentItem,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentSearchResult,
} from "../types";

export class DocumentsResource {
  constructor(private http: HttpClient) {}

  /** List documents in a project */
  async list(projectId: string): Promise<DocumentItem[]> {
    const res = await this.http.get<{ items: DocumentItem[]; meta: { total: number } }>(
      `/api/projects/${projectId}/documents`,
    );
    return res.items;
  }

  /** Get document by ID (with content) */
  async get(projectId: string, id: string): Promise<DocumentDetail> {
    return this.http.get<DocumentDetail>(
      `/api/projects/${projectId}/documents/${id}`,
    );
  }

  /** Create a new document in a project */
  async create(projectId: string, input?: CreateDocumentInput): Promise<DocumentDetail> {
    return this.http.post<DocumentDetail>(
      `/api/projects/${projectId}/documents`,
      input ?? {},
    );
  }

  /** Update document (title, icon, cover, content) */
  async update(projectId: string, id: string, input: UpdateDocumentInput): Promise<DocumentDetail> {
    return this.http.patch<DocumentDetail>(
      `/api/projects/${projectId}/documents/${id}`,
      input,
    );
  }

  /** Delete document */
  async delete(projectId: string, id: string): Promise<void> {
    await this.http.delete(`/api/projects/${projectId}/documents/${id}`);
  }

  /** Resolve a document by ID only (no projectId needed) */
  async resolve(id: string): Promise<DocumentDetail> {
    return this.http.get<DocumentDetail>(
      `/api/projects/documents/resolve/${id}`,
    );
  }

  /** Search documents by title within a project */
  async search(projectId: string, query: string): Promise<DocumentSearchResult[]> {
    const res = await this.http.get<{ items: DocumentSearchResult[]; meta: { total: number } }>(
      `/api/projects/${projectId}/documents/search?q=${encodeURIComponent(query)}`,
    );
    return res.items;
  }
}
