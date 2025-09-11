import type { z } from "zod";

// ==== Error Types ====

export type ZError<T = unknown> = z.ZodError<T>;

// ==== Substrate Query Error ====

export class SbQueryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SbQueryError";
  }

  static from(error: Error): SbQueryError {
    return new SbQueryError(error.message, { cause: error });
  }
}
