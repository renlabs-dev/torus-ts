/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access */

import type { HTTPError } from "ky";
import type { z } from "zod";

export class KaitoTwitterAPIError extends Error {
  public readonly status?: number;
  public readonly response?: Response;
  public readonly apiErrorCode?: string;

  constructor(
    message: string,
    options?: {
      status?: number;
      response?: Response;
      apiErrorCode?: string;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = "KaitoTwitterAPIError";
    this.status = options?.status;
    this.response = options?.response;
    this.apiErrorCode = options?.apiErrorCode;
    this.cause = options?.cause;
  }
}

export class KaitoAuthenticationError extends KaitoTwitterAPIError {
  constructor(message: string = "Authentication failed") {
    super(message);
    this.name = "KaitoAuthenticationError";
  }
}

export class KaitoRateLimitError extends KaitoTwitterAPIError {
  public readonly retryAfter?: number;

  constructor(message: string = "Rate limit exceeded", retryAfter?: number) {
    super(message);
    this.name = "KaitoRateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class KaitoValidationError extends KaitoTwitterAPIError {
  public readonly zodError: z.ZodError;

  constructor(message: string, zodError: z.ZodError) {
    super(message);
    this.name = "KaitoValidationError";
    this.zodError = zodError;

    // Debug log validation errors in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Zod validation error details:",
        JSON.stringify(this.zodError, null, 2),
      );
    }
  }

  override toString(): string {
    return `KaitoValidationError: ${this.message}\n${JSON.stringify(this.zodError, null, 2)}`;
  }
}

export async function handleKyError(error: unknown): Promise<never> {
  if (error instanceof Error && error.name === "HTTPError") {
    const httpError = error as HTTPError;
    const status = httpError.response.status;

    try {
      const responseText = await httpError.response.clone().text();
      // biome-ignore lint/suspicious/noExplicitAny: API error data can be various shapes
      let errorData: any;

      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }

      const message =
        errorData?.msg || errorData?.message || `HTTP ${status} error`;

      switch (status) {
        case 401:
        case 403:
          throw new KaitoAuthenticationError(message);
        case 429: {
          const retryAfter = httpError.response.headers.get("retry-after");
          throw new KaitoRateLimitError(
            message,
            retryAfter ? Number.parseInt(retryAfter, 10) : undefined,
          );
        }
        default:
          throw new KaitoTwitterAPIError(message, {
            status,
            response: httpError.response,
            apiErrorCode: errorData?.code,
          });
      }
    } catch (parseError) {
      if (parseError instanceof KaitoTwitterAPIError) {
        throw parseError;
      }

      throw new KaitoTwitterAPIError(`HTTP ${status} error`, {
        status,
        response: httpError.response,
        cause: parseError,
      });
    }
  }

  if (error instanceof Error && error.name === "TimeoutError") {
    throw new KaitoTwitterAPIError("Request timeout", { cause: error });
  }

  if (error instanceof Error && error.name === "AbortError") {
    throw new KaitoTwitterAPIError("Request was aborted", { cause: error });
  }

  // Re-throw if already a KaitoTwitterAPIError
  if (error instanceof KaitoTwitterAPIError) {
    throw error;
  }

  // Generic error
  const message =
    error instanceof Error ? error.message : "Unknown error occurred";
  throw new KaitoTwitterAPIError(message, { cause: error });
}
