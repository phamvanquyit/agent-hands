import { HttpClient, type ClientOptions } from "./http";
import { AuthResource } from "./resources/auth";
import { UsersResource } from "./resources/user";
import { VariablesResource } from "./resources/variable";
import { TablesResource } from "./resources/table";
import { DatabasesResource } from "./resources/database";
import { ApiKeysResource } from "./resources/api-key";
import { ProjectsResource } from "./resources/project";
import { DocumentsResource } from "./resources/document";
import { ApiDocsResource } from "./resources/api-doc";
import { StorageResource } from "./resources/storage";
import { McpToolServersResource } from "./resources/mcp-tool-server";
import { SystemResource } from "./resources/system";

class MoroClient {
  private http: HttpClient;

  public readonly auth: AuthResource;
  public readonly users: UsersResource;
  public readonly variables: VariablesResource;
  public readonly tables: TablesResource;
  public readonly databases: DatabasesResource;
  public readonly apiKeys: ApiKeysResource;
  public readonly projects: ProjectsResource;
  public readonly documents: DocumentsResource;
  public readonly apiDocs: ApiDocsResource;
  public readonly storage: StorageResource;
  public readonly mcpToolServers: McpToolServersResource;
  public readonly system: SystemResource;

  constructor(options: ClientOptions) {
    this.http = new HttpClient(options);
    this.auth = new AuthResource(this.http);
    this.users = new UsersResource(this.http);
    this.variables = new VariablesResource(this.http);
    this.tables = new TablesResource(this.http);
    this.databases = new DatabasesResource(this.http);
    this.apiKeys = new ApiKeysResource(this.http);
    this.projects = new ProjectsResource(this.http);
    this.documents = new DocumentsResource(this.http);
    this.apiDocs = new ApiDocsResource(this.http);
    this.storage = new StorageResource(this.http);
    this.mcpToolServers = new McpToolServersResource(this.http);
    this.system = new SystemResource(this.http);
  }

  get accessToken() {
    return this.http.accessToken;
  }

  setTokens(accessToken: string, refreshToken?: string) {
    this.http.setTokens(accessToken, refreshToken);
  }
}

export const API_BASE = import.meta.env.VITE_API_URL || "";

export const client = new MoroClient({
  baseUrl: API_BASE,
  onTokenChange: ({ accessToken, refreshToken }) => {
    if (accessToken) {
      localStorage.setItem("access_token", accessToken);
    }
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }
  },
  onRefreshFail: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/ui";
  },
});

// Restore tokens from localStorage on init
const savedToken = localStorage.getItem("access_token");
const savedRefresh = localStorage.getItem("refresh_token");
if (savedToken) {
  client.setTokens(savedToken, savedRefresh ?? undefined);
}
