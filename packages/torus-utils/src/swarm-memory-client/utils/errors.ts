/**
 * Base error class for SwarmMemory API errors
 */
export class SwarmMemoryError extends Error {
  public override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "SwarmMemoryError";
    this.cause = cause;
  }
}

/**
 * Authentication-specific errors for SwarmMemory
 */
export class SwarmAuthenticationError extends SwarmMemoryError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = "SwarmAuthenticationError";
  }
}

/**
 * Network or timeout errors when calling SwarmMemory API
 */
export class SwarmNetworkError extends SwarmMemoryError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = "SwarmNetworkError";
  }
}

/**
 * Validation errors for SwarmMemory API responses or parameters
 */
export class SwarmValidationError extends SwarmMemoryError {
  constructor(
    message: string,
    public readonly validationDetails?: unknown,
  ) {
    super(message);
    this.name = "SwarmValidationError";
  }
}

/**
 * Rate limit errors from SwarmMemory API
 */
export class SwarmRateLimitError extends SwarmMemoryError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "SwarmRateLimitError";
  }
}
