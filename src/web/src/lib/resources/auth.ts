import type { HttpClient } from "../http";
import type { ChangePasswordInput, LoginInput, LoginResult, RefreshResult, User } from "../types";

export class AuthResource {
  constructor(private http: HttpClient) {}

  /** Login with email + password → sets tokens on the client */
  async login(input: LoginInput): Promise<LoginResult> {
    const res = await this.http.post<LoginResult>("/api/auth/login", input);
    this.http.setTokens(res.access_token, res.refresh_token);
    return res;
  }

  /** Refresh access token using the stored refresh token (rotates both tokens) */
  async refresh(refreshToken: string): Promise<RefreshResult> {
    const res = await this.http.post<RefreshResult>("/api/auth/refresh", {
      refresh_token: refreshToken,
    });
    this.http.setTokens(res.access_token, res.refresh_token);
    return res;
  }

  /** Get current authenticated user */
  async me(): Promise<User> {
    return this.http.get<User>("/api/auth/me");
  }

  /** Change password for the current authenticated user */
  async changePassword(input: ChangePasswordInput): Promise<void> {
    await this.http.post<{ success: boolean }>("/api/auth/change-password", input);
  }

  /** Clear tokens (client-side logout) */
  logout(): void {
    this.http.clearTokens();
  }
}
