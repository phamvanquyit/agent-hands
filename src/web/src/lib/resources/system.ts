import type { HttpClient } from "../http";

export interface VersionInfo {
  current: string;
  latest: string | null;
  hasUpdate: boolean;
  channel: "stable" | "dev";
  isPreRelease: boolean;
  installCommand: string | null;
  checkedAt: number;
}

export interface SystemInfo {
  cpu: {
    model: string;
    cores: number;
    usage: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
    mount: string;
  };
  process: {
    pid: number;
    uptime: number;
    memoryRss: number;
    memoryHeap: number;
    bunVersion: string;
    nodeVersion: string;
  };
  os: {
    platform: string;
    arch: string;
    hostname: string;
    release: string;
    uptime: number;
  };

  timestamp: number;
}

export class SystemResource {
  constructor(private http: HttpClient) {}

  getVersion(): Promise<VersionInfo> {
    return this.http.get<VersionInfo>("/api/system/version");
  }

  getSystemInfo(): Promise<SystemInfo> {
    return this.http.get<SystemInfo>("/api/system/info");
  }



  getUpdateChannel(): Promise<{ channel: "stable" | "dev" }> {
    return this.http.get<{ channel: "stable" | "dev" }>("/api/system/update-channel");
  }

  setUpdateChannel(channel: "stable" | "dev"): Promise<{ channel: "stable" | "dev" }> {
    return this.http.request<{ channel: "stable" | "dev" }>("PUT", "/api/system/update-channel", { channel });
  }
}
