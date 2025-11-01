import {
  ApiKeyAuth,
  BaseAPIClient,
} from "@torus-network/torus-utils/base-api-client";
import { z } from "zod";
// import { ApiKeyAuth } from "../shared/auth/index.js";
import type { KaitoApiResponse, KaitoClientConfig } from "./types.js";
import {
  API_BASE_URL,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_TIMEOUT,
} from "./utils/constants.js";
import { KaitoTwitterAPIError, KaitoValidationError } from "./utils/errors.js";

export class KaitoTwitterAPIClient extends BaseAPIClient {
  readonly apiKey: string;

  constructor(config: KaitoClientConfig) {
    super({
      baseUrl: config.baseURL || API_BASE_URL,
      auth: new ApiKeyAuth(config.apiKey),
      timeout: config.timeout || DEFAULT_TIMEOUT,
      retryConfig: config.retryConfig || DEFAULT_RETRY_CONFIG,
      defaultHeaders: {
        "Content-Type": "application/json",
        "User-Agent": "torus-swarm-bot/1.0",
      },
    });

    this.apiKey = config.apiKey;
  }

  // HTTP methods are now inherited from BaseAPIClient

  // Override to handle KaitoTwitterAPI-specific error responses
  protected override validateResponse<T>(
    data: unknown,
    schema: z.ZodType<T>,
  ): T {
    try {
      const validated = schema.parse(data);

      // If the response has a status field and it's an error, throw an API error
      if (
        typeof validated === "object" &&
        validated !== null &&
        "status" in validated
      ) {
        if (validated.status === "error") {
          const errorData = validated;

          const parsedErrorData = z
            .object({
              status: z.literal("error"),
              msg: z.string().optional().default("<No error message>"),
              error_code: z.string().optional().default("<No error code>"),
            })
            .parse(errorData);

          throw new KaitoTwitterAPIError(parsedErrorData.msg || "API Error", {
            // status: parsedErrorData.status,
            apiErrorCode: parsedErrorData.error_code,
          });
        }
      }

      return validated;
    } catch (error) {
      if (error instanceof KaitoTwitterAPIError) {
        throw error; // Re-throw API errors
      }
      if (error instanceof z.ZodError) {
        throw new KaitoValidationError("Response validation failed", error);
      }
      throw error;
    }
  }

  // cleanSearchParams is now inherited from BaseAPIClient

  /**
   * Helper method to validate API responses with the common KaitoApiResponse structure
   * This method maintains backward compatibility with existing endpoint code
   */
  validateApiResponse<T>(data: unknown, dataSchema: z.ZodType<T>): T {
    const apiResponseSchema = z.object({
      data: dataSchema.optional(),
      status: z.enum(["success", "error"]),
      msg: z.string().optional(),
    });

    const response = this.validateResponse(
      data,
      apiResponseSchema,
    ) as KaitoApiResponse<T>;
    return unwrapApiResponse(response);
  }
}

/**
 * Unwrap API response that has nested data structures
 * Common pattern where response has { data: actualData, status: "success" }
 */
export function unwrapApiResponse<T>(response: {
  data?: T;
  status?: string;
}): T {
  if (response.status === "error") {
    throw new Error("API returned error status");
  }

  if (response.data === undefined) {
    throw new Error("API response missing data field");
  }

  return response.data;
}
