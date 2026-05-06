import type { HttpClient } from "../http";
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from "../types";

export class ProjectsResource {
  constructor(private http: HttpClient) {}

  /** List all projects */
  async list(): Promise<Project[]> {
    const res = await this.http.get<{ items: Project[]; meta: { total: number } }>("/api/projects");
    return res.items;
  }

  /** Get project by ID */
  async get(id: string): Promise<Project> {
    return this.http.get<Project>(`/api/projects/${id}`);
  }

  /** Create a new project */
  async create(input: CreateProjectInput): Promise<Project> {
    return this.http.post<Project>("/api/projects", input);
  }

  /** Update project */
  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    return this.http.patch<Project>(`/api/projects/${id}`, input);
  }

  /** Delete project */
  async delete(id: string): Promise<void> {
    await this.http.delete(`/api/projects/${id}`);
  }
}
