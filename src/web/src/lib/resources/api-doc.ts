import type { HttpClient } from "../http";
import type { ApiDocsData } from "../types";

export class ApiDocsResource {
  constructor(private http: HttpClient) {}

  /** Get full API documentation data */
  async get(): Promise<ApiDocsData> {
    return this.http.get<ApiDocsData>("/api/docs");
  }
}
