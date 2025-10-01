import ky from "ky";
import type {
  BeforeRequestHook,
  KyInstance,
  Options as KyOptions,
  NormalizedOptions,
} from "ky";
import type { z } from "zod";
import type { AuthStrategy } from "./auth/index.js";
import { handleRequestError, ValidationError } from "./errors.js";

export interface BaseClientConfig {
  baseUrl: string;
  auth: AuthStrategy;
  timeout?: number;
  retryConfig?: KyOptions["retry"];
  defaultHeaders?: Record<string, string>;
}

/**
 * Abstract base class for API clients with shared HTTP functionality
 */
export abstract class BaseAPIClient {
  protected readonly http: KyInstance;
  protected readonly auth: AuthStrategy;

  constructor(config: BaseClientConfig) {
    this.auth = config.auth;

    const handleAuthHook: BeforeRequestHook = async (
      request: Request,
      options: NormalizedOptions,
    ): Promise<void> => {
      await this.handleAuth(request, options);
    };

    const kyOptions: KyOptions = {
      prefixUrl: config.baseUrl,
      timeout: config.timeout || 30000,
      retry: config.retryConfig,
      headers: config.defaultHeaders,
      hooks: {
        beforeRequest: [handleAuthHook],
      },
    };

    this.http = ky.create(kyOptions);
  }

  /**
   * HTTP GET with Zod validation
   */
  async get<T>(
    url: string,
    params: Record<string, string | number | boolean | undefined>,
    outSchema: z.ZodType<T>,
  ): Promise<T> {
    try {
      const cleanParams = this.cleanSearchParams(params);
      const response = await this.http.get(url, { searchParams: cleanParams });
      const data = await response.json();

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[API] Response from ${url}:`,
          JSON.stringify(data, null, 2),
        );
      }

      return this.validateResponse(data, outSchema);
    } catch (error) {
      throw await handleRequestError(error, this.constructor.name);
    }
  }

  /**
   * HTTP POST with Zod validation
   */
  async post<T>(
    url: string,
    body: unknown,
    outSchema: z.ZodType<T>,
  ): Promise<T> {
    try {
      const response = await this.http.post(url, {
        json: body,
      });
      const data = await response.json();

      return this.validateResponse(data, outSchema);
    } catch (error) {
      throw await handleRequestError(error, this.constructor.name);
    }
  }

  /**
   * HTTP PUT with Zod validation
   */
  async put<T>(
    url: string,
    body: unknown,
    outSchema: z.ZodType<T>,
  ): Promise<T> {
    try {
      const response = await this.http.put(url, {
        json: body,
      });
      const data = await response.json();

      return this.validateResponse(data, outSchema);
    } catch (error) {
      throw await handleRequestError(error, this.constructor.name);
    }
  }

  /**
   * HTTP DELETE with Zod validation
   */
  async delete<T>(
    url: string,
    body: unknown,
    outSchema: z.ZodType<T>,
  ): Promise<T> {
    try {
      const response = await this.http.delete(url, {
        json: body,
      });
      const data = await response.json();

      return this.validateResponse(data, outSchema);
    } catch (error) {
      throw await handleRequestError(error, this.constructor.name);
    }
  }

  /**
   * Validate response data against Zod schema
   */
  protected validateResponse<T>(data: unknown, schema: z.ZodType<T>): T {
    const parseResult = schema.safeParse(data);
    if (parseResult.success) {
      return parseResult.data;
    } else {
      throw new ValidationError(
        "Response validation failed",
        parseResult.error,
      );
    }
  }

  /**
   * Clean search parameters by removing undefined/null/empty values
   */
  protected cleanSearchParams(
    params?: Record<string, string | number | boolean | undefined>,
  ): Record<string, string> | undefined {
    if (!params) return undefined;

    const cleaned: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value != undefined && value !== "") {
        cleaned[key] = String(value);
      }
    }

    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  /**
   * Handle authentication for requests
   */
  private async handleAuth(
    request: Request,
    _options: NormalizedOptions,
  ): Promise<void> {
    await this.auth.authenticate(request);

    // Log the request in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[${this.constructor.name}] ${request.method} ${request.url}`,
      );
    }
  }
}
