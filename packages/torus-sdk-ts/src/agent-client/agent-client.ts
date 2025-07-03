import { z } from "zod";
import type { Keypair } from "./keypair.js";

/**
 * Configuration options for the AgentClient
 */
export interface AgentClientOptions {
  /** The keypair for creating JWT tokens */
  keypair: Keypair;
  /** The base URL of the agent server (e.g., 'http://localhost:3000') */
  baseUrl: string;
}

/**
 * Options for making a call to an agent endpoint
 */
export interface CallOptions {
  /** The endpoint path (without leading slash, e.g., 'hello') */
  endpoint: string;
  /** The HTTP method to use. @default 'POST' */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** The request body data */
  data?: unknown;
}

/**
 * Response from an agent endpoint call
 */
export interface CallResponse<T = unknown> {
  /** Whether the request was successful */
  success: boolean;
  /** The response data (present if success is true) */
  data?: T;
  /** Error information (present if success is false) */
  error?: {
    message: string;
    code?: string;
    status: number;
  };
}

/**
 * Schema for error response from agent endpoints
 */
const ErrorResponseSchema = z.object({
  message: z.string().optional(),
  code: z.string().optional(),
});

/**
 * Simple client for calling Agent Server endpoints with automatic JWT authentication
 *
 * @example
 * ```typescript
 * const keypair = new Keypair("your twelve word mnemonic phrase here...");
 * const client = new AgentClient({
 *   keypair,
 *   baseUrl: "http://localhost:3000"
 * });
 *
 * const response = await client.call({
 *   endpoint: "hello",
 *   data: { name: "Alice" }
 * });
 *
 * if (response.success) {
 *   console.log(response.data);
 * } else {
 *   console.error(response.error);
 * }
 * ```
 */
export class AgentClient {
  private keypair: Keypair;
  private baseUrl: string;

  constructor(options: AgentClientOptions) {
    this.keypair = options.keypair;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
  }

  /**
   * Makes a call to an agent endpoint with automatic JWT authentication
   */
  async call<T = unknown>(options: CallOptions): Promise<CallResponse<T>> {
    try {
      const jwtToken = await this.keypair.createJWT();
      const url = `${this.baseUrl}/${options.endpoint.replace(/^\//, "")}`;
      const method = options.method ?? "POST";

      const requestInit: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      };

      if (method !== "GET" && options.data !== undefined) {
        requestInit.body = JSON.stringify(options.data);
      }

      const response = await fetch(url, requestInit);

      let responseData: unknown;
      try {
        responseData = await response.json();
      } catch {
        return {
          success: false,
          error: {
            message: "Failed to parse response JSON",
            status: response.status,
          },
        };
      }

      if (response.ok) {
        return { success: true, data: responseData as T };
      } else {
        const errorResult = ErrorResponseSchema.safeParse(responseData);
        const errorData = errorResult.success ? errorResult.data : {};

        return {
          success: false,
          error: {
            message: errorData.message ?? `HTTP ${response.status}`,
            code: errorData.code,
            status: response.status,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          status: 0,
        },
      };
    }
  }
}
