import type { HttpClient } from "../http";

export interface VersionInfo {
  current: string;
  latest: string | null;
  hasUpdate: boolean;
  checkedAt: number;
}

export class SystemResource {
  constructor(private http: HttpClient) {}

  getVersion(): Promise<VersionInfo> {
    return this.http.get<VersionInfo>("/api/system/version");
  }

  triggerUpdate(): Promise<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>("/api/system/update");
  }
}
