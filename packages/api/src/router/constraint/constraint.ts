/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
 
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable no-debugger */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import {
  createChainAwareReteNetwork,
  safeParseConstraintJson,
  createChainWatcher,
  validateConstraint,
} from "@torus-ts/dsl";
import type { Constraint, SpecificFact, BoolExprType, NumExprType, BaseConstraintType, CompOp } from "@torus-ts/dsl";
import {
  permissionSchema,
  constraintSchema,
  permissionDetailsSchema,
  permissionEmissionScopeSchema,
  emissionStreamsSchema,
  emissionStreamsDetailsSchema,
  enforcementAuthoritySchema,
} from "@torus-ts/db/schema";
import { eq } from "drizzle-orm";
import type { DB } from "@torus-ts/db/client";
import type { PermissionContract, SS58Address } from "@torus-network/sdk";
import { queryPermission, togglePermission, sb_h256, sb_address, SS58_SCHEMA } from "@torus-network/sdk";
import { authenticatedProcedure, publicProcedure } from "../../trpc";

// Global Rete network instance (in production, this might be managed differently)
let globalReteNetwork: ReturnType<typeof createChainAwareReteNetwork> | null =
  null;
let globalChainWatcher: ReturnType<typeof createChainWatcher> | null = null;

import { match } from "rustie";

/**
 * Load existing constraints from database and add them to the RETE network
 */
async function loadExistingConstraints(db: DB, network: ReturnType<typeof createChainAwareReteNetwork>) {
  try {
    console.log("🔄 Loading existing constraints from database...");
    console.log("🔍 [DEBUG] Database connection:", !!db);
    console.log("🔍 [DEBUG] Network instance:", !!network);
    
    // Query all constraint records from the database
    console.log("🔍 [DEBUG] Querying constraint table...");
    const constraintRecords = await db
      .select()
      .from(constraintSchema);
    
    console.log(`📊 Found ${constraintRecords.length} existing constraints in database`);
    console.log("🔍 [DEBUG] Constraint records:", constraintRecords);
    
    for (const record of constraintRecords) {
      try {
        // Parse the constraint body from the database
        const constraintBody = superjson.parse(record.body);
        
        // We need to get the permission ID from the permission_details table
        const permissionDetails = await db
          .select()
          .from(permissionDetailsSchema)
          .where(eq(permissionDetailsSchema.constraint_id, record.id))
          .limit(1);
        
        const constrainedPermission = permissionDetails[0];
        if (!constrainedPermission) {
          console.warn(`⚠️  No permission details found for constraint ${record.id}`);
          continue;
        }
        
        // Validate the parsed constraint body and create the constraint object
        const constraintData = {
          permId: constrainedPermission.permission_id,
          body: constraintBody
        };
        
        // Use validateConstraint to ensure the constraint is properly typed
        const constraint = validateConstraint(constraintData);
        
        // Add constraint to the network with fact fetching
        const result = await network.addConstraintWithFacts(constraint);
        
        console.log(`✅ Loaded constraint ${constraint.permId} with production ID: ${result.productionId}`);
        
      } catch (error) {
        console.error(`❌ Failed to load constraint ${record.id}:`, error);
      }
    }
    
    console.log("🎉 Finished loading existing constraints from database");
    
  } catch (error) {
    console.error("❌ Failed to load existing constraints from database:", error);
  }
}

// Initialize the network if it doesn't exist
async function getOrCreateReteNetwork(db?: DB) {
  
  if (!globalReteNetwork) {
    // Use environment variable for WebSocket endpoint
    const wsEndpoint =
      process.env.NEXT_PUBLIC_TORUS_RPC_URL ??
      "wss://api.testnet.torus.network";

    // Create network with constraint violation callback
    globalReteNetwork = createChainAwareReteNetwork(
      wsEndpoint,
      async (constraintId: string) => {
        console.log(`🚨 CONSTRAINT VIOLATION DETECTED: ${constraintId}`);
        console.log(
          `📝 Taking action for violated constraint: ${constraintId}`,
        );
        // At this point globalReteNetwork should be assigned
        if (!globalReteNetwork) {
          console.error(`❌ No global RETE network available for constraint ${constraintId}`);
          return;
        }
        
        const api = await globalReteNetwork.getFetcher().ensureConnected();
        
        // Get the constraint to find its associated permission ID
        const constraint = globalReteNetwork.getConstraint(constraintId);
        if (!constraint) {
          console.error(`❌ Could not find constraint ${constraintId}`);
          return;
        }
        
        // Toggle the permission that this constraint applies to
        void togglePermission(api, sb_h256.parse(constraint.permId), false);
        // Here you could implement various enforcement actions:
        // - Send alerts/notifications
        // - Log violations to a database
        // - Trigger automatic remediation
        // - Disable permissions
        // - Send messages to external systems

        try {
          // For now, just log the violation with timestamp
          const timestamp = new Date().toISOString();
          console.log(
            `⚠️  [${timestamp}] Constraint ${constraintId} became violated - enforcement action triggered`,
          );

          // Example: Could save to database, send webhook, etc.
          // await saveViolationToDatabase(constraintId, timestamp);
          // await sendViolationNotification(constraintId);
        } catch (error) {
          console.error(
            `❌ Error in violation handler for constraint ${constraintId}:`,
            error,
          );
        }
      },
    );

    console.log(
      "🚀 Initialized global ChainAwareReteNetwork with violation callback",
    );

    // Initialize and start chain watcher automatically
    globalChainWatcher = createChainWatcher(globalReteNetwork);
    console.log("🔗 Initialized global ChainWatcher");

    // Start watching blockchain events automatically
    globalChainWatcher
      .startWatching()
      .then(() => {
        console.log("👀 Chain watcher started automatically");
      })
      .catch((error) => {
        console.error("❌ Failed to start chain watcher automatically:", error);
      });
    
    // Load existing constraints from database if db is provided
    if (db) {
      console.log("🔍 [DEBUG] DB provided, loading existing constraints...");
      await loadExistingConstraints(db, globalReteNetwork);
      console.log("🔍 [DEBUG] Finished loading existing constraints");
    } else {
      console.log("⚠️  [DEBUG] No database provided to getOrCreateReteNetwork");
    }
  }
  return globalReteNetwork;
}

// Zod schema for constraint input
const constraintInputSchema = z.object({
  constraint: z.union([
    z.string().describe("JSON string representation of the constraint"),
    z
      .object({
        permId: z.string(),
        body: z.any(), // The constraint body structure
      })
      .describe("Direct constraint object"),
  ]),
});

const constraintIdSchema = z.object({
  constraintId: z.string(),
});

/**
 * Stores permission and constraint data in the database following proper foreign key order
 * All operations are performed within a database transaction for atomicity
 */
async function storePermissionAndConstraintInDB(
  db: DB,
  constraint: Constraint,
  permissionData: PermissionContract,
): Promise<NonNullable<any>> {
  return await db.transaction(async (tx) => {
    // Step 1: Handle emission streams first (if needed)
    let streamsUuid: string | null = null;
    if (
      "Emission" in permissionData.scope &&
      "Streams" in permissionData.scope.Emission.allocation
    ) {
      // Create emission stream record first
      const [streamRecord] = await tx
        .insert(emissionStreamsSchema)
        .values({
          permission_id: constraint.permId,
        })
        .returning();

      if (!streamRecord) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create emission stream record in database",
        });
      }

      streamsUuid = streamRecord.streams_uuid;

      // Create stream details for each stream
      const streamsMap = permissionData.scope.Emission.allocation.Streams;
      const streamDetails: {
        streams_uuid: string;
        permission_id: string;
        stream_id: string;
        percentage: number;
      }[] = [];

      for (const [streamId, percentage] of streamsMap.entries()) {
        streamDetails.push({
          streams_uuid: streamsUuid, // Safe because we're inside the Streams allocation check
          permission_id: constraint.permId, // New required field
          stream_id: streamId,
          percentage: Number(percentage),
        });
      }

      await tx.insert(emissionStreamsDetailsSchema).values(streamDetails);
    }

    // Step 2: Create permission emission scope record (requires streams_uuid)
    let distributionType: "MANUAL" | "AUTOMATIC" | "AT_BLOCK" | "INTERVAL" =
      "MANUAL";
    let distributionInfo: string | null = null;

    if ("Emission" in permissionData.scope) {
      const distribution = permissionData.scope.Emission.distribution;
      if ("Manual" in distribution) {
        distributionType = "MANUAL";
        distributionInfo = null;
      } else if ("Automatic" in distribution) {
        distributionType = "AUTOMATIC";
        console.log(
          "[DEBUG] Processing Automatic distribution:",
          typeof distribution.Automatic,
          distribution.Automatic,
        );
        distributionInfo = String(distribution.Automatic);
        console.log("[DEBUG] Converted to string:", distributionInfo);
      } else if ("AtBlock" in distribution) {
        distributionType = "AT_BLOCK";
        distributionInfo = distribution.AtBlock.toString();
      } else if ("Interval" in distribution) {
        distributionType = "INTERVAL";
        distributionInfo = distribution.Interval.toString();
      }
    }

    if (!streamsUuid) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Emission streams UUID is required for permission creation",
      });
    }

    const [emissionScopeRecord] = await tx
      .insert(permissionEmissionScopeSchema)
      .values({
        permission_id: constraint.permId,
        streams_uuid: streamsUuid,
        distribution_type: distributionType,
        distribution_info: distributionInfo,
        accumulating:
          "Emission" in permissionData.scope
            ? permissionData.scope.Emission.accumulating
            : false,
      })
      .returning();

    if (!emissionScopeRecord) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Failed to create permission emission scope record in database",
      });
    }

    console.log("emissionScopeRecord", emissionScopeRecord);

    // Step 3: Create permission record (requires permission_id from emission scope)
    const [permissionRecord] = await tx
      .insert(permissionSchema)
      .values({
        permission_id: constraint.permId,
      })
      .returning();

    if (!permissionRecord) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create permission record in database",
      });
    }

    console.log("permissionRecord", permissionRecord);

    debugger;
    console.log("constraint.permId", constraint.body);

    // Step 4: Create constraint record (independent)
    const [constraintRecord] = await tx
      .insert(constraintSchema)
      .values({
        body: superjson.stringify(constraint.body), // Serialize the body (BoolExpr) part as text
      })
      .returning();

    if (!constraintRecord) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create constraint record in database",
      });
    }

    console.log("constraintRecord", constraintRecord);

    // Step 5: Create permission details record (requires permission_id and constraint_id)
    const [permissionDetailsRecord] = await tx
      .insert(permissionDetailsSchema)
      .values({
        permission_id: constraint.permId,
        grantor_key: permissionData.grantor,
        grantee_key: permissionData.grantee,
        scope: "EMISSION",
        duration:
          "UntilBlock" in permissionData.duration
            ? permissionData.duration.UntilBlock.toString()
            : null,
        revocation: "Irrevocable" in permissionData.revocation ? 0 : 1,
        execution_count: (permissionData.executionCount || 0).toString(),
        parent_id: permissionData.parent ? String(permissionData.parent) : null,
        constraint_id: constraintRecord.id,
      })
      .returning();

    console.log("permissionDetailsRecord", permissionDetailsRecord);

    // Step 6: Create enforcement authority records
    if (
      permissionData.enforcement &&
      Array.isArray(permissionData.enforcement)
    ) {
      const enforcementRecords = permissionData.enforcement.map(
        (address: string) => ({
          permission_id: constraint.permId,
          ss58_address: address,
        }),
      );

      await tx
        .insert(enforcementAuthoritySchema)
        .values(enforcementRecords)
        .onConflictDoNothing();
      console.log(
        `[TEST] Created ${enforcementRecords.length} enforcement authority records`,
      );
    }

    return constraintRecord;
  });
}

export const constraintRouter = {
  /**
   * Add a constraint for testing (no authentication required)
   * This endpoint is for development and testing purposes only
   */
  addTest: authenticatedProcedure
    .input(constraintInputSchema)
    .mutation(async ({ ctx, input }) => {
      let constraint: Constraint;

      // Parse constraint based on input type
      if (typeof input.constraint === "string") {
        // Parse from JSON string
        const parseResult = safeParseConstraintJson(input.constraint);
        if (!parseResult.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid constraint JSON: ${parseResult.error.message}`,
            cause: parseResult.error,
          });
        }
        constraint = parseResult.data;
      } else {
        // Use direct object (with basic validation)
        constraint = input.constraint as Constraint;
      }

      // 1. Query permission data from blockchain using the constraint's permId
      console.log(
        `[TEST] Querying permission ${constraint.permId} from blockchain...`,
      );
      const wsAPI = await ctx.wsAPI;
      // Ensure permId is a hex string
      const hexPermId = constraint.permId.startsWith("0x")
        ? (constraint.permId as `0x${string}`)
        : `0x${constraint.permId}`;
      const permissionResult = await queryPermission(
        wsAPI,
        hexPermId as `0x${string}`,
      );

      // Destructure the Result-style tuple [error, data]
      const [permissionError, permissionData] = permissionResult;
      if (permissionError !== undefined) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to query permission: ${permissionError}`,
          cause: permissionError,
        });
      }

      if (!permissionData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Permission with ID "${constraint.permId}" does not exist on the Torus blockchain. Please verify the permission ID is correct and has been created on-chain before adding constraints.`,
        });
      }
      
      if (permissionData) {
        // guarantees we only process streams TODO: also accept fixed amount
        const scope = permissionData.scope;
        match(scope)({
          Emission: function (v) {
            match(v.allocation)({
              Streams: function (streams) {
                return streams;
              },
              FixedAmount: function (_amount) {
                throw new Error(
                  "FixedAmount allocation is not supported for constraints for now",
                );
              },
            });
          },
          Curator: function (v): unknown {
            throw new Error("Function not implemented.");
          },
        });
      }


      // Check if allocator address is in enforcement authorities
      const allocatorAddress = ctx.allocatorAddress
      const hasAllocatorAuthority = match(permissionData.enforcement)({
        ControlledBy(controlled) {
          return controlled.controllers.includes(allocatorAddress);
        },
        None() {
          return false;
        },
      });

      if (!hasAllocatorAuthority) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Permission "${constraint.permId}" does not grant enforcement authority to the allocator (${allocatorAddress}). The allocator must be included in the permission's enforcement authorities to add constraints.`,
        });
      }


      // 2. Check if permission already exists in database
      const existingPermission = await ctx.db
        .select()
        .from(permissionSchema)
        .where(eq(permissionSchema.permission_id, constraint.permId))
        .limit(1);

      if (existingPermission.length > 0) {
        console.log(
          `[DEBUG] Permission ${constraint.permId} already exists in database`,
        );
        
        // Still need to create the constraint record and link it
        const [constraintRecord] = await ctx.db
          .insert(constraintSchema)
          .values({
            body: superjson.stringify(constraint.body),
          })
          .returning();
        
        if (!constraintRecord) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create constraint record in database",
          });
        }
        
        // Update the existing permission details to link to this constraint
        await ctx.db
          .update(permissionDetailsSchema)
          .set({ constraint_id: constraintRecord.id })
          .where(eq(permissionDetailsSchema.permission_id, constraint.permId));
        
        console.log(
          `[DEBUG] Created constraint record with ID: ${constraintRecord.id} and linked to existing permission`,
        );
      } else {
        // 3. Store permission and constraint data in database (creates new permission)
        const constraintRecord = await storePermissionAndConstraintInDB(
          ctx.db,
          constraint,
          permissionData,
        );
        console.log(
          `[DEBUG] Created constraint record in DB with ID: ${constraintRecord.id}`,
        );
      }

      // 4. Get the Rete network from context and add constraint
      const network = await ctx.reteNetwork;

      // Add constraint with automatic fact fetching
      let result: {
        productionId: string;
        fetchedFacts: SpecificFact[];
        replacedConstraints: string[];
      };
      try {
        result = await network.addConstraintWithFacts(constraint);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to add constraint to the network: ${error instanceof Error ? error.message : String(error)}`,
          cause: error,
        });
      }

      // Log the successful addition
      console.log(
        `[TEST] Added constraint ${constraint.permId} with production ID: ${result.productionId}`,
      );
      console.log(
        `[TEST] Constraint activated: ${network.isConstraintActivated(result.productionId)}`,
      );

      // Simplified return to avoid BigInt serialization issues
      return {
        success: true,
        productionId: result.productionId,
        constraintId: constraint.permId,
        activated: network.isConstraintActivated(result.productionId),
        fetchedFactsCount: result.fetchedFacts.length,
        fetchedFactsTypes: result.fetchedFacts.map(
          (fact: SpecificFact) => fact.type,
        ),
        permissionExists: true,
      };
    }),

  /**
   * Check if a constraint is activated
   */
  checkActivation: publicProcedure
    .input(constraintIdSchema)
    .query(async ({ ctx, input }) => {
      const network = await ctx.reteNetwork;
      const isActivated = network.isConstraintActivated(input.constraintId);

      return {
        constraintId: input.constraintId,
        activated: isActivated,
      };
    }),

  /**
   * Get the evaluation status of a constraint (satisfied/violated/unknown)
   */
  getEvaluationStatus: publicProcedure
    .input(constraintIdSchema)
    .query(async ({ ctx, input }) => {
      const network = await ctx.reteNetwork;
      const status = network.getConstraintEvaluationStatus(input.constraintId);

      return {
        constraintId: input.constraintId,
        status,
      };
    }),

  /**
   * Get detailed status information about a constraint
   */
  getDetailedStatus: publicProcedure
    .input(constraintIdSchema)
    .query(async ({ ctx, input }) => {
      const network = await ctx.reteNetwork;
      const statusInfo = network.getConstraintStatus(input.constraintId);

      return {
        constraintId: input.constraintId,
        ...statusInfo,
        // Remove the constraint object to avoid serialization issues with BigInt
        constraint: statusInfo.constraint
          ? {
              permId: statusInfo.constraint.permId,
              bodyType: typeof statusInfo.constraint.body,
            }
          : undefined,
      };
    }),

  /**
   * Get constraint activations (the facts that triggered the constraint)
   */
  getActivations: publicProcedure
    .input(constraintIdSchema)
    .query(async ({ ctx, input }) => {
      const network = await ctx.reteNetwork;
      const activations = network.getConstraintActivations(input.constraintId);

      return {
        constraintId: input.constraintId,
        activationCount: activations.length,
        activations: activations.map((token: any, index: number) => ({
          activationIndex: index,
          facts: Array.from(
            token.facts.entries() as Iterable<[string, any]>,
          ).map(([key, fact]) => ({
            key,
            type: fact.type,
            fact,
          })),
        })),
      };
    }),

  /**
   * Get network visualization for debugging
   */
  getNetworkState: publicProcedure.query(async ({ ctx }) => {
    const network = await ctx.reteNetwork;
    const visualization = network.visualizeNetwork();

    return {
      visualization,
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Get structured network components for detailed inspection
   */
  getNetworkComponents: publicProcedure.query(async ({ ctx }) => {
    const network = await ctx.reteNetwork;
    const components = network.getNetworkComponents();

    return {
      ...components,
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Health check for the constraint system
   */
  healthCheck: publicProcedure.query(async ({ ctx }) => {
    const network = await ctx.reteNetwork;

    return {
      status: "healthy",
      networkInitialized: !!globalReteNetwork,
      chainWatcherInitialized: !!globalChainWatcher,
      //chainWatcherActive: globalChainWatcher?.isCurrentlyWatching() || false,
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Debug endpoint to check database content
   */
  debugDatabase: publicProcedure.query(async ({ ctx }) => {
    try {
      const constraintRecords = await ctx.db.select().from(constraintSchema);
      const permissionRecords = await ctx.db.select().from(permissionSchema); 
      const permissionDetails = await ctx.db.select().from(permissionDetailsSchema);

      return {
        constraintCount: constraintRecords.length,
        permissionCount: permissionRecords.length,
        permissionDetailsCount: permissionDetails.length,
        sampleConstraints: constraintRecords.slice(0, 3),
        samplePermissions: permissionRecords.slice(0, 3),
        samplePermissionDetails: permissionDetails.slice(0, 3),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
        constraintCount: 0,
        permissionCount: 0,
        permissionDetailsCount: 0,
      };
    }
  }),
} satisfies TRPCRouterRecord;
