import type { AuthStrategy, TokenProvider } from "./strategies.js";

/**
 * Bearer token authentication strategy for services that use Bearer tokens
 */
export class BearerTokenAuth implements AuthStrategy {
  constructor(readonly tokenProvider: TokenProvider) {}

  async authenticate(request: Request): Promise<void> {
    const token = await this.tokenProvider.getToken();
    request.headers.set("Authorization", `Bearer ${token}`);
  }

  async isValid(): Promise<boolean> {
    return await this.tokenProvider.isValid();
  }

  async refresh(): Promise<void> {
    await this.tokenProvider.refresh();
  }
}
