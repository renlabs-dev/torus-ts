import type { AuthStrategy } from "./strategies.js";

/**
 * API key authentication strategy for services that use API keys in headers
 */
export class ApiKeyAuth implements AuthStrategy {
  constructor(
    private readonly apiKey: string,
    private readonly header: string = "X-API-Key",
  ) {}

  async authenticate(request: Request): Promise<void> {
    request.headers.set(this.header, this.apiKey);
  }

  async isValid(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }
}
