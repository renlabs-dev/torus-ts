import { serve } from '@hono/node-server';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import type { Balance, SS58Address } from '@torus-network/sdk';
import type { Context } from 'hono';
import { rateLimiter } from 'hono-rate-limiter';
import { cors } from 'hono/cors';
import { z } from 'zod';

import {
  type ApiPromise,
  type Helpers,
  checkTransaction,
  connectToChainRpc,
  getTotalStake,
} from './helpers.js';
import { type TokenData, type RequestData, decodeAuthToken, validateRequestSignature, ensureTrailingSlash, getCurrentProtocolVersion } from './utils.js';

/**
 * User type definition
 */
type User = {
  /** The wallet address of the user */
  walletAddress: SS58Address;
};

type StakeLimiterOptions = {
  /** Whether to enable the rate limiter. @default false */
  enabled: boolean;
  /** The limit of requests per minute */
  limit: ({
    userWalletAddress,
    userTotalStake,
  }: {
    userWalletAddress: SS58Address;
    userTotalStake: Balance;
  }) => number;
  /** The time window in milliseconds for the rate limit. @default 60000 */
  window: number;
};

/**
 * Configuration options for the Agent class
 */
type AgentOptions = {
  /** The address of the agent */
  address: string;
  /** Port number for the server to listen on. @default 3000 */
  port?: number;
  /** Authentication configuration */
  auth?: {
    /** The name of the header to check for authentication. @default 'Authorization' */
    headerName?: string;
    /** The callback to be called after the authentication is successful */
    onAfterAuth?: (user: User) => Promise<void> | void;
  };
  stakeLimiter?: StakeLimiterOptions;
  /** Documentation configuration */
  docs: {
    /** Whether to enable OpenAPI documentation. @default true */
    enabled?: boolean;
    /** Path where the OpenAPI documentation will be served. @default '/docs' */
    path?: string;
    /** OpenAPI documentation metadata */
    info: {
      /** Title of the API */
      title: string;
      /** Version of the API */
      version: string;
    };
  };
};

/**
 * Options for defining a method's input and output schemas
 * @template I - Input schema type
 * @template O - Output schema type for successful responses
 * @template E - Error schema type
 */
type MethodOptions<
  I extends z.ZodSchema,
  O extends z.ZodSchema,
  E extends z.ZodSchema | undefined,
> = {
  /** The HTTP method to use for the method. @default 'post' */
  method?: 'get' | 'post';
  stakeLimiter?: StakeLimiterOptions;
  auth?: {
    /** Whether the method requires authentication. @default false */
    required?: boolean;
  };
  /** Input validation schema */
  input:
    | I
    | {
        /** Input validation schema */
        schema: I;
        /** Whether the input is a multipart form data */
        multipartFormData: boolean;
      };
  /** Output configuration for both successful and error responses */
  output: {
    /** Configuration for successful responses */
    ok: {
      /** Description of the successful response */
      description: string;
      /** Schema for the successful response */
      schema: O;
    };
    /** Configuration for error responses */
    err: {
      /** Description of the error response */
      description: string;
      /** Schema for the error response */
      schema: E;
    };
  };
};

type CallbackContext = {
  user?: User;
  agent: {
    /** The address of the agent */
    address: string;
  };
} & Helpers;

/**
 * Callback function type for handling method requests
 * @template I - Input schema type
 * @template O - Output schema type for successful responses
 * @template E - Error schema type
 * @param input - The validated input data based on the input schema
 * @param helpers - A collection of helper functions and utilities that can be used within the callback
 * @returns A Promise that resolves to either a successful response with `ok` or an error response with `err`
 *
 * @example
 * ```typescript
 * const callback: MethodCallback<InputSchema, OutputSchema, ErrorSchema> = async (input, helpers) => {
 *   // Process the input
 *   const result = await someAsyncOperation(input);
 *
 *   // Return success
 *   return { ok: { message: 'Success', data: result } };
 *
 *   // Or return error
 *   return { err: { message: 'Something went wrong', code: 'ERROR_CODE' } };
 * };
 * ```
 */
type MethodCallback<
  I extends z.ZodSchema,
  O extends z.ZodSchema,
  E extends z.ZodSchema,
> = (
  input: z.infer<I>,
  context: CallbackContext,
) => Promise<{ ok: z.infer<O> } | { err: z.infer<E> }>;

/**
 * Agent class for creating and managing API endpoints with OpenAPI documentation
 *
 * This class provides a simple way to create API endpoints with automatic OpenAPI documentation
 * generation. It uses Hono for routing and Zod for schema validation.
 *
 * @example
 * ```typescript
 * const agent = new Agent({
 *   port: 3000,
 *   docs: {
 *     info: {
 *       title: 'My API',
 *       version: '1.0.0'
 *     }
 *   }
 * });
 *
 * agent.method('hello', {
 *   input: z.object({ name: z.string() }),
 *   output: {
 *     ok: {
 *       description: 'Successful response',
 *       schema: z.object({ message: z.string() })
 *     },
 *     err: {
 *       description: 'Error response',
 *       schema: z.object({ error: z.string() })
 *     }
 *   }
 * }, async (input) => {
 *   return { ok: { message: `Hello ${input.name}!` } };
 * });
 *
 * agent.run();
 * ```
 */
export class Agent {
  /** Hono application instance */
  private app: OpenAPIHono = new OpenAPIHono();
  private api!: ApiPromise;
  /** Agent configuration options */
  private options: AgentOptions;

  /**
   * Creates a new Agent instance
   * @param options - Configuration options for the Agent
   */
  constructor(options: AgentOptions) {
    this.options = options;
    this.init();
  }

  /**
   * Initializes the Agent instance
   * @private
   */
  private async init() {
    this.app.use('*', cors());

    this.api = await connectToChainRpc();

    this.setupDocs();
  }

  /**
   * Sets up OpenAPI documentation if enabled
   * @private
   */
  private setupDocs() {
    const { docs } = this.options;

    if (docs.enabled === false) {
      return;
    }

    this.app.doc(docs?.path ?? '/docs', {
      openapi: '3.0.0',
      info: docs.info,
    });
  }

  private getAuthRequestData(c: Context): { userWalletAddress: SS58Address } | null {
    // Try signature-based authentication first
    const signature = c.req.header('X-Signature');
    const publicKey = c.req.header('X-Public-Key');
    const walletAddress = c.req.header('X-Wallet-Address');
    const timestamp = parseInt(c.req.header('X-Timestamp') || '0');

    if (signature && publicKey && walletAddress && timestamp) {
      const requestData: RequestData = {
        userWalletAddress: walletAddress as SS58Address,
        userPublicKey: publicKey,
        method: c.req.method,
        path: c.req.path,
        timestamp,
        _protocol_metadata: {
          version: getCurrentProtocolVersion(),
        },
      };

      const validatedRequest = validateRequestSignature(signature, requestData);
      if (validatedRequest) {
        return { userWalletAddress: validatedRequest.userWalletAddress };
      }
    }

    // Fallback to JWT token authentication
    const token = c.req
      .header(this.options?.auth?.headerName ?? 'Authorization')
      ?.split(' ')[1];

    if (token) {
      const decodedToken = decodeAuthToken(token);
      if (decodedToken) {
        return { userWalletAddress: decodedToken.userWalletAddress };
      }
    }

    return null;
  }

  /**
   * Registers a new API method
   * @template I - Input schema type
   * @template O - Output schema type for successful responses
   * @template E - Error schema type
   * @param name - Name of the method (will be used as the endpoint path)
   * @param options - Method configuration including input/output schemas
   * @param callback - Function to handle the method request
   */
  method<I extends z.ZodSchema, O extends z.ZodSchema, E extends z.ZodSchema>(
    name: string,
    options: MethodOptions<I, O, E>,
    callback: MethodCallback<I, O, E>,
  ) {
    const httpMethod = options?.method ?? 'post';

    const keyGenerator = (c: Context) => {
      const requestData = this.getAuthRequestData(c);

      if (!requestData) {
        return '';
      }

      return c.req.header('x-forwarded-for') ?? requestData.userWalletAddress;
    };

    const getStakeLimiterMiddleware = () => {
      const stakeLimiter = options.stakeLimiter ?? this.options.stakeLimiter;

      if (!stakeLimiter?.enabled) {
        return null;
      }

      const limit = async (c: Context) => {
        const requestData = this.getAuthRequestData(c);

        if (!requestData) {
          return 0;
        }

        const stake = await getTotalStake(this.api)(
          requestData.userWalletAddress,
        );

        if (!stakeLimiter.limit) {
          return 0;
        }

        return stakeLimiter.limit({
          userWalletAddress: requestData.userWalletAddress,
          userTotalStake: stake,
        });
      };

      return [
        rateLimiter({
          limit,
          windowMs: stakeLimiter.window,
          keyGenerator,
        }),
      ];
    };

    const newMethodSchema = createRoute({
      method: httpMethod,
      path: ensureTrailingSlash(name),
      security: options.auth?.required ? [{ Bearer: [] }] : undefined,
      middleware: getStakeLimiterMiddleware() ?? undefined,
      request: {
        ...(httpMethod === 'post'
          ? {
              body: {
                content: {
                  ...(typeof options.input === 'object' &&
                  'multipartFormData' in options.input &&
                  options.input.multipartFormData
                    ? {
                        'multipart/form-data': {
                          schema: options.input.schema,
                        },
                      }
                    : {
                        'application/json': {
                          schema: options.input,
                        },
                      }),
                },
              },
            }
          : {}),
      },
      responses: {
        200: {
          description: options.output.ok.description,
          content: {
            'application/json': {
              schema: options.output.ok.schema,
            },
          },
        },
        400: {
          description: options.output.err.description,
          content: {
            'application/json': {
              schema: options.output.err.schema,
            },
          },
        },
        ...(options.auth?.required
          ? {
              401: {
                description: 'Unauthorized',
                content: {
                  'application/json': {
                    schema: z.object({
                      message: z.string(),
                    }),
                  },
                },
              },
            }
          : {}),
      },
    });

    const handler = async (c: Context) => {
      let authData: { userWalletAddress: SS58Address } | null = null;
      if (options.auth?.required) {
        authData = this.getAuthRequestData(c);

        if (!authData) {
          return c.json({ message: 'Missing or invalid authentication' }, 401);
        }
      }

      const isMultipartFormData =
        'multipartFormData' in options.input && options.input.multipartFormData;

      let input: unknown;
      if (
        httpMethod === 'post' &&
        typeof options.input === 'object' &&
        'multipartFormData' in options.input &&
        options.input.multipartFormData
      ) {
        const formData = await c.req.formData();
        input = Object.fromEntries(formData.entries());
      }

      if (httpMethod === 'post' && !isMultipartFormData) {
        input = await c.req.json();
      }

      const context: CallbackContext = {
        ...(authData
          ? { user: { walletAddress: authData.userWalletAddress } }
          : {}),
        agent: {
          address: this.options.address,
        },
        checkTransaction: checkTransaction(this.api),
        getTotalStake: getTotalStake(this.api),
      };

      const result = await callback(input, context);

      if ('ok' in result) {
        return c.json(result.ok);
      }

      return c.json(result.err, 400);
    };

    this.app.openapi(newMethodSchema, handler);

    return this;
  }

  /**
   * Returns the Request handler
   * @returns The Request handler
   */
  public request = this.app.request;

  /**
   * Starts the server and begins listening for requests
   */
  public run() {
    serve(
      {
        fetch: this.app.fetch,
        port: this.options.port ?? 3000,
      },
      (info) => console.log(`Server running on port ${info.port}`),
    );
  }
}
