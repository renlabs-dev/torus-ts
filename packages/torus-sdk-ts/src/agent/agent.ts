import { serve } from "@hono/node-server";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { ApiPromise } from "@polkadot/api";
import type { EventRecord } from "@polkadot/types/interfaces";
import type { Codec } from "@polkadot/types/types";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { match } from "rustie";
import { z } from "zod";

import type { SS58Address } from "@torus-network/sdk/types";

import { queryNamespacePermissions } from "../chain/permission0.js";
import { queryAgents } from "../chain/torus0/agents.js";
import { connectToChainRpc } from "../utils/index.js";
import type { Helpers } from "./helpers.js";
import { checkTransaction } from "./helpers.js";
import type { AuthTokenResult } from "./utils.js";
import { decodeAuthToken, ensureTrailingSlash, selectRpcUrl } from "./utils.js";

interface User {
  walletAddress: SS58Address;
}

/**
 * Configuration options for the Agent class
 */
interface AgentOptions {
  /** The SS58 address key of this agent (used for querying namespace permissions) */
  agentKey: SS58Address;
  /** Port number for the server to listen on. @default 3000 */
  port?: number;
  /** Authentication configuration */
  auth?: {
    /** The name of the header to check for authentication. @default 'Authorization' */
    headerName?: string;
    /** The callback to be called after the authentication is successful */
    onAfterAuth?: (user: User) => Promise<void> | void;
    /** Maximum age of JWT tokens in seconds. If now - iat > jwtMaxAge, reject the token. @default 3600 (1 hour) */
    jwtMaxAge?: number;
  };
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
}

/**
 * Options for defining a method's input and output schemas
 * @template I - Input schema type
 * @template O - Output schema type for successful responses
 * @template E - Error schema type
 */
interface MethodOptions<
  I extends z.ZodSchema,
  O extends z.ZodSchema,
  E extends z.ZodSchema | undefined,
> {
  /** The HTTP method to use for the method. @default 'post' */
  method?: "get" | "post" | "put" | "patch" | "delete";
  auth?: {
    /** Whether the method requires authentication. @default false */
    required?: boolean;
  };
  /** Namespace permission configuration for this endpoint */
  namespace?: {
    /** Whether to enable namespace permission checking for this endpoint. @default true */
    enabled?: boolean;
    /** Custom namespace path for this endpoint. If not provided, uses agent.<agent_name>.<endpoint_name> */
    path?: string;
    /** List of RPC endpoint URLs for checking namespace permissions on the Torus blockchain. @default ['wss://api.testnet.torus.network'] */
    rpcUrls?: string[];
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
}

interface CallbackContext extends Helpers {
  user?: User;
}

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
export class AgentServer {
  /** Hono application instance */
  private app: OpenAPIHono = new OpenAPIHono();
  private api!: ApiPromise;
  /** Agent configuration options */
  private options: AgentOptions;
  /** Resolved agent name from blockchain lookup */
  private agentName: string | null = null;
  /** Cached namespace permissions that this agent is delegating (namespace path -> grantees[]) */
  private delegatedNamespacePermissions = new Map<string, SS58Address[]>();
  /** Promise that resolves when initialization is complete */
  private initPromise: Promise<void> | null = null;
  /** Subscription to blockchain events for real-time permission updates */
  private eventSubscription: (() => void) | null = null;

  /**
   * Creates a new Agent instance
   * @param options - Configuration options for the Agent
   */
  constructor(options: AgentOptions) {
    this.options = options;

    // Setup initialization middleware that runs before all requests
    this.app.use("*", this.initMiddleware);
    this.app.use("*", cors());

    // Setup docs immediately - they don't depend on blockchain data
    this.setupDocs();
  }

  /**
   * Middleware that ensures initialization is complete before processing requests
   */
  private initMiddleware = async (c: Context, next: () => Promise<void>) => {
    if (!this.initPromise) {
      console.log("Initializing agent server...");
      this.initPromise = this.init();
    }
    await this.initPromise;
    await next();
  };

  /**
   * Initializes the Agent instance
   * @private
   */
  private async init() {
    const wsUrl = selectRpcUrl();

    this.api = await connectToChainRpc(wsUrl);

    // Resolve agent name from blockchain
    await this.resolveAgentName();

    // Load and cache namespace permissions that this agent is delegating
    await this.loadDelegatedNamespacePermissions();

    // Start listening for blockchain events to keep permissions up-to-date
    await this.startEventListening();

    console.log("Agent initialization complete.");
  }

  /**
   * Resolves the agent name from the blockchain by matching agentKey
   * @private
   */
  private async resolveAgentName() {
    try {
      console.log(`Resolving agent name for key: ${this.options.agentKey}`);
      const agents = await queryAgents(this.api);

      // Find the agent with matching key
      const matchingAgent = agents.get(this.options.agentKey);

      if (matchingAgent) {
        this.agentName = matchingAgent.name;
        console.log(`Resolved agent name: ${this.agentName}`);
      } else {
        throw new Error(`Agent not found for key: ${this.options.agentKey}`);
      }
    } catch (error) {
      console.error("Failed to resolve agent name:", error);
      throw error;
    }
  }

  /**
   * Starts listening to blockchain events for permission changes
   * @private
   */
  private async startEventListening() {
    console.log("Starting blockchain event listener for permission updates...");

    // Subscribe to system events - this returns an unsubscribe function
    const unsubscribe = await this.api.query.system.events(
      (events: EventRecord[]) => {
        this.handleChainEvents(events);
      },
    );

    this.eventSubscription = unsubscribe;
    console.log("Blockchain event listener started successfully");
  }

  /**
   * Handle blockchain events and update namespace permissions cache
   * @private
   */
  private handleChainEvents(events: EventRecord[]) {
    for (const record of events) {
      const { event } = record;
      // Only handle permission0 events that involve our agent
      if (event.section === "permission0") {
        switch (event.method) {
          case "PermissionDelegated":
          case "PermissionRevoked":
          case "PermissionExpired":
            this.handlePermissionChange(event.method, event.data);
            break;

          default:
            // Ignore other permission events
            break;
        }
      }
    }
  }

  /**
   * Handle permission change events (granted, revoked, expired)
   * @private
   */
  private handlePermissionChange(eventMethod: string, eventData: Codec[]) {
    try {
      // Event data structure: [delegator, recipient, permissionId]
      const [delegator, recipient, permissionId] = eventData;

      if (!delegator || !recipient || !permissionId) {
        return;
      }

      const delegatorStr = delegator.toString();

      // Only care about permissions involving our agent as delegator
      if (delegatorStr === this.options.agentKey) {
        console.log(
          `Permission ${eventMethod.toLowerCase()} by our agent: ${permissionId.toString()}`,
        );
        // Refresh the cached permissions
        void this.loadDelegatedNamespacePermissions();
      }
    } catch (error) {
      console.error(`Error handling ${eventMethod} event:`, error);
    }
  }

  /**
   * Stops the blockchain event listener
   * @private
   */
  private stopEventListening() {
    if (this.eventSubscription) {
      console.log("Stopping blockchain event listener...");
      this.eventSubscription();
      this.eventSubscription = null;
      console.log("Blockchain event listener stopped");
    }
  }

  /**
   * Loads and caches namespace permissions that this agent is delegating
   * @private
   */
  private async loadDelegatedNamespacePermissions() {
    try {
      console.log(
        `Loading delegated namespace permissions for agent key: ${this.options.agentKey}`,
      );

      const [error, namespacePermissions] = await queryNamespacePermissions(
        this.api,
      );

      if (error) {
        console.error("Failed to query namespace permissions:", error);
        return;
      }

      // Filter for permissions where this agent is the delegator and organize by namespace path
      Array.from(namespacePermissions.entries())
        .filter(
          ([_, permission]) => permission.delegator === this.options.agentKey,
        )
        .forEach(([permissionId, permission]) => {
          match(permission.scope)({
            Namespace: (namespaceScope) => {
              // Handle new namespace scope structure with paths as Map<Option<H256>, string[]>
              for (const [_parent, paths] of namespaceScope.paths.entries()) {
                // For each path in this permission, add the recipient to the list
                paths.forEach((path) => {
                  const normalizedPath = path.join(".").toLowerCase();
                  const existingRecipients =
                    this.delegatedNamespacePermissions.get(normalizedPath) ??
                    [];
                  if (!existingRecipients.includes(permission.recipient)) {
                    existingRecipients.push(permission.recipient);
                    this.delegatedNamespacePermissions.set(
                      normalizedPath,
                      existingRecipients,
                    );
                  }
                });
              }
              console.log(
                `Cached namespace permission ${permissionId} for recipient ${permission.recipient}`,
              );
            },
            Emission: () => {
              // Skip emission permissions
            },
            Curator: () => {
              // Skip curator permissions
            },
          });
        });

      console.log(
        `Loaded namespace permissions for ${this.delegatedNamespacePermissions.size} paths`,
      );
    } catch (error) {
      console.error("Error loading delegated namespace permissions:", error);
    }
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

    this.app.doc(docs.path ?? "/docs", {
      openapi: "3.0.0",
      info: docs.info,
    });
  }

  private getAuthRequestData(c: Context): AuthTokenResult | null {
    const token = c.req
      .header(this.options.auth?.headerName ?? "Authorization")
      ?.split(" ")[1];

    if (token) {
      const jwtMaxAge = this.options.auth?.jwtMaxAge;
      const authResult = decodeAuthToken(token, jwtMaxAge);
      return authResult;
    }

    return null;
  }

  /**
   * Checks if a user has permission to access a specific namespace path using cached permissions.
   * @param userAddress - The SS58 address of the user
   * @param namespacePath - The namespace path to check (e.g., 'agent.alice.memory.twitter')
   * @returns boolean - true if the user has permission, false otherwise
   */
  private checkNamespacePermission(
    userAddress: SS58Address,
    namespacePath: string,
  ): boolean {
    const normalizedPath = namespacePath.toLowerCase();

    const exactMatchGrantees =
      this.delegatedNamespacePermissions.get(normalizedPath);
    if (exactMatchGrantees?.includes(userAddress)) {
      console.log(
        `User ${userAddress} has exact permission for ${normalizedPath}`,
      );
      return true;
    }
    console.log(
      `User ${userAddress} does not have permission for namespace ${normalizedPath}`,
    );
    return false;
  }

  private getNamespacePath(
    endpointName: string,
    httpMethod: string,
    customPath?: string,
  ): string {
    if (customPath) {
      return customPath;
    }

    if (!this.agentName) {
      throw new Error(
        "Agent name not resolved. Cannot generate namespace path.",
      );
    }
    return `agent.${this.agentName.toLowerCase()}.${endpointName.toLowerCase()}.${httpMethod.toLowerCase()}`;
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
    const httpMethod = options.method ?? "post";

    const newMethodSchema = createRoute({
      method: httpMethod,
      path: ensureTrailingSlash(name),
      security: options.auth?.required ? [{ Bearer: [] }] : undefined,
      request: {
        ...(httpMethod === "post"
          ? {
              body: {
                content: {
                  ...(typeof options.input === "object" &&
                  "multipartFormData" in options.input &&
                  options.input.multipartFormData
                    ? {
                        "multipart/form-data": {
                          schema: options.input.schema,
                        },
                      }
                    : {
                        "application/json": {
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
            "application/json": {
              schema: options.output.ok.schema,
            },
          },
        },
        400: {
          description: options.output.err.description,
          content: {
            "application/json": {
              schema: options.output.err.schema,
            },
          },
        },
        ...(options.auth?.required
          ? {
              401: {
                description: "Unauthorized",
                content: {
                  "application/json": {
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
        const authResult = this.getAuthRequestData(c);

        if (!authResult) {
          return c.json(
            {
              message: "Missing authentication headers",
              code: "MISSING_AUTH_HEADERS",
            },
            401,
          );
        }

        if (!authResult.success) {
          return c.json(
            { message: authResult.error, code: authResult.code },
            401,
          );
        }

        authData = { userWalletAddress: authResult.data.userWalletAddress };
      }

      if (options.namespace?.enabled !== false && authData) {
        const namespacePath = this.getNamespacePath(
          name,
          httpMethod,
          options.namespace?.path,
        );
        const hasPermission = this.checkNamespacePermission(
          authData.userWalletAddress,
          namespacePath,
        );

        if (!hasPermission) {
          return c.json(
            {
              message: `Access denied: insufficient permissions for namespace ${namespacePath}`,
              code: "NAMESPACE_ACCESS_DENIED",
            },
            403,
          );
        }
      }

      const isMultipartFormData =
        "multipartFormData" in options.input && options.input.multipartFormData;

      let input: unknown;
      if (
        httpMethod === "post" &&
        typeof options.input === "object" &&
        "multipartFormData" in options.input &&
        options.input.multipartFormData
      ) {
        const formData = await c.req.formData();
        input = Object.fromEntries(formData.entries());
      }

      if (httpMethod === "post" && !isMultipartFormData) {
        input = await c.req.json();
      }

      const context: CallbackContext = {
        ...(authData
          ? { user: { walletAddress: authData.userWalletAddress } }
          : {}),
        checkTransaction: checkTransaction(this.api),
      };

      const result = await callback(input, context);

      if ("ok" in result) {
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
