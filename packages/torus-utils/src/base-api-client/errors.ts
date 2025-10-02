import { HTTPError, TimeoutError } from "ky";
import type { z } from "zod";

interface BaseAPIErrorOptions<E = undefined> {
  status?: number;
  response?: Response;
  apiErrorCode?: string;
  cause?: E;
}

export class BaseAPIError<E = undefined> extends Error {
  public readonly status?: number;
  public readonly response?: Response;
  public readonly apiErrorCode?: string;

  constructor(message: string, options?: BaseAPIErrorOptions<E>) {
    super(message);
    this.name = "BaseAPIError";
    this.status = options?.status;
    this.response = options?.response;
    this.apiErrorCode = options?.apiErrorCode;
    this.cause = options?.cause;
  }
}

export class AuthenticationError<E = undefined> extends BaseAPIError<E> {
  constructor(
    message: string = "Authentication failed",
    options?: BaseAPIErrorOptions<E>,
  ) {
    super(message, options);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError<E = undefined> extends BaseAPIError<E> {
  public readonly retryAfter?: number;

  constructor(
    message: string = "Rate limit exceeded",
    retryAfter?: number,
    options?: BaseAPIErrorOptions<E>,
  ) {
    super(message, options);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class ValidationError<E = undefined> extends BaseAPIError<E> {
  public readonly zodError: z.ZodError;

  constructor(
    message: string,
    zodError: z.ZodError,
    options?: BaseAPIErrorOptions<E>,
  ) {
    super(message, options);
    this.name = "ValidationError";
    this.zodError = zodError;

    // Debug log validation errors in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Zod validation error details:",
        JSON.stringify(this.zodError.issues, null, 2),
      );
    }
  }

  override toString(): string {
    return `ValidationError: ${this.message}\n${JSON.stringify(this.zodError.issues, null, 2)}`;
  }
}

export async function handleHttpError<E = undefined>(
  httpError: HTTPError,
): Promise<AuthenticationError<E> | RateLimitError<E> | ValidationError<E>> {
  const status = httpError.response.status;

  const responseText = await httpError.response.clone().text();

  // TODO: Remove any usage - define proper error response types for different APIs
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
  let errorData: any;
  try {
    errorData = JSON.parse(responseText);
  } catch {
    errorData = { message: responseText };
  }

  const message =
    errorData?.msg || errorData?.message || `HTTP ${status} error`;

  const opts = {
    cause: httpError,
    status,
    response: httpError.response,
    apiErrorCode: errorData?.code,
  };

  switch (status) {
    case 401:
    case 403:
      return new AuthenticationError(message, opts);
    case 429: {
      const retryAfter = httpError.response.headers.get("retry-after");
      return new RateLimitError(
        message,
        retryAfter ? Number.parseInt(retryAfter, 10) : undefined,
      );
    }
    default:
      return new BaseAPIError(message, {
        status,
        response: httpError.response,
        apiErrorCode: errorData?.code,
      });
  }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
}

/**
 * Generic request error handler that can be specialized by client implementations
 */
export async function handleRequestError(
  error: unknown,
  _clientName: string = "API",
): Promise<BaseAPIError> {
  if (error instanceof HTTPError) {
    return await handleHttpError(error);
  }

  if (error instanceof TimeoutError) {
    return new BaseAPIError("Request timeout", { cause: error });
  }

  if (error instanceof Error && error.name === "AbortError") {
    return new BaseAPIError("Request was aborted", { cause: error });
  }

  // Re-throw if already a BaseAPIError
  if (error instanceof BaseAPIError) {
    return error;
  }

  // Generic error
  const message =
    error instanceof Error ? error.message : "Unknown error occurred";
  return new BaseAPIError(message, { cause: error });
}
