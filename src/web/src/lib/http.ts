import type { ApiError } from "./types";

/** Error thrown when the API returns a non-OK response */
export class MoroError extends Error {
  public readonly status: number;
  public readonly error: string;
  public readonly details?: unknown[];

  constructor(status: number, body: ApiError) {
    super(body.message);
    this.name = "MoroError";
    this.status = status;
    this.error = body.error;
    this.details = body.details;
  }
}

export interface ClientOptions {
  baseUrl: string;
  accessToken?: string;
  refreshToken?: string;
  onTokenChange?: (tokens: { accessToken: string; refreshToken?: string }) => void;
  onRefreshFail?: () => void;
}

/** Decode JWT payload (base64url) — no signature verification, just expiry */
function getTokenExpiry(token?: string): number | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export class HttpClient {
  private _baseUrl: string;
  private _accessToken?: string;
  private _refreshToken?: string;
  private _refreshing: Promise<void> | null = null;

  private _onTokenChange?: ClientOptions["onTokenChange"];
  private _onRefreshFail?: ClientOptions["onRefreshFail"];

  constructor(options: ClientOptions) {
    this._baseUrl = options.baseUrl.replace(/\/$/, "");
    this._accessToken = options.accessToken;
    this._refreshToken = options.refreshToken;

    this._onTokenChange = options.onTokenChange;
    this._onRefreshFail = options.onRefreshFail;
  }

  get accessToken() {
    return this._accessToken;
  }

  setTokens(accessToken: string, refreshToken?: string) {
    this._accessToken = accessToken;
    if (refreshToken) this._refreshToken = refreshToken;

    this._onTokenChange?.({ accessToken, refreshToken });
  }

  clearTokens() {
    this._accessToken = undefined;
    this._refreshToken = undefined;
  }

  /** Proactively refresh access token if it expires within 60 seconds */
  private async ensureFreshToken(): Promise<void> {
    if (!this._accessToken || !this._refreshToken) return;

    const expiry = getTokenExpiry(this._accessToken);
    if (!expiry) return;

    const now = Date.now();
    const refreshThreshold = 60 * 1000; // refresh if expires within 60s
    if (expiry - now > refreshThreshold) return; // still fresh

    // Deduplicate concurrent refresh calls
    if (this._refreshing) {
      await this._refreshing;
      return;
    }

    this._refreshing = (async () => {
      try {
        const res = await fetch(`${this._baseUrl}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: this._refreshToken }),
        });
        if (res.ok) {
          const data = await res.json() as { access_token: string; refresh_token: string };
          this.setTokens(data.access_token, data.refresh_token);
        } else {
          // Refresh failed — clear tokens and notify
          this.clearTokens();
          this._onRefreshFail?.();
        }
      } catch {
        // Network error — don't force logout, let the next request fail naturally
      }
    })();

    try {
      await this._refreshing;
    } finally {
      this._refreshing = null;
    }
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    // Proactively refresh token if it's about to expire
    await this.ensureFreshToken();

    const url = `${this._baseUrl}${path}`;
    const headers: Record<string, string> = {};

    if (this._accessToken) {
      headers["Authorization"] = `Bearer ${this._accessToken}`;
    }

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let errorBody: ApiError;
      try {
        errorBody = (await res.json()) as ApiError;
      } catch {
        errorBody = { error: "unknown", message: res.statusText };
      }
      throw new MoroError(res.status, errorBody);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  get<T>(path: string) {
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body);
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>("PATCH", path, body);
  }

  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }

  /** Send a FormData (multipart) request — used for file uploads */
  async requestFormData<T>(method: string, path: string, formData: FormData): Promise<T> {
    await this.ensureFreshToken();

    const url = `${this._baseUrl}${path}`;
    const headers: Record<string, string> = {};

    if (this._accessToken) {
      headers["Authorization"] = `Bearer ${this._accessToken}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: formData,
    });

    if (!res.ok) {
      let errorBody: ApiError;
      try {
        errorBody = (await res.json()) as ApiError;
      } catch {
        errorBody = { error: "unknown", message: res.statusText };
      }
      throw new MoroError(res.status, errorBody);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  /** Send a raw binary body request — used for file uploads */
  async requestBinary<T>(
    method: string,
    path: string,
    body: Blob | ArrayBuffer | Uint8Array,
    contentType?: string,
  ): Promise<T> {
    await this.ensureFreshToken();

    const url = `${this._baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": contentType ?? "application/octet-stream",
    };

    if (this._accessToken) {
      headers["Authorization"] = `Bearer ${this._accessToken}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body as BodyInit,
    });

    if (!res.ok) {
      let errorBody: ApiError;
      try {
        errorBody = (await res.json()) as ApiError;
      } catch {
        errorBody = { error: "unknown", message: res.statusText };
      }
      throw new MoroError(res.status, errorBody);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
}
