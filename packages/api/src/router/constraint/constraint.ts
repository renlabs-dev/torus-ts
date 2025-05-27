import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import { 
  createChainAwareReteNetwork, 
  parseConstraintJson, 
  safeParseConstraintJson, 
  createChainWatcher,
  type Constraint,
  type SpecificFact
} from "@torus-ts/dsl";
import { 
  permissionSchema, 
  constraintSchema, 
  permissionDetailsSchema,
  permissionEmissionScopeSchema,
  emissionStreamsSchema,
  emissionStreamsDetailsSchema,
  enforcementAuthoritySchema
} from "@torus-ts/db/schema";
import { eq } from "drizzle-orm";
import type { DB } from "@torus-ts/db/client";
import { PermissionContract, queryPermission, SS58Address } from "@torus-network/sdk";
import { publicProcedure, authenticatedProcedure } from "../../trpc";

// Global Rete network instance (in production, this might be managed differently)
let globalReteNetwork: ReturnType<typeof createChainAwareReteNetwork> | null = null;
let globalChainWatcher: ReturnType<typeof createChainWatcher> | null = null;

import { match } from "rustie";

// Initialize the network if it doesn't exist
function getOrCreateReteNetwork() {
  if (!globalReteNetwork) {
    // Use environment variable for WebSocket endpoint
    const wsEndpoint = process.env.NEXT_PUBLIC_TORUS_RPC_URL || 'wss://api.testnet.torus.network';
    globalReteNetwork = createChainAwareReteNetwork(wsEndpoint);
    console.log('Initialized global ChainAwareReteNetwork');
    
    // Initialize and start chain watcher automatically
    globalChainWatcher = createChainWatcher(globalReteNetwork);
    console.log('Initialized global ChainWatcher');
    
    // Start watching blockchain events automatically
    globalChainWatcher.startWatching()
      .then(() => {
        console.log('Chain watcher started automatically');
      })
      .catch((error) => {
        console.error('Failed to start chain watcher automatically:', error);
      });
  }
  return globalReteNetwork;
}

// Zod schema for constraint input
const constraintInputSchema = z.object({
  constraint: z.union([
    z.string().describe('JSON string representation of the constraint'),
    z.object({
      permId: z.string(),
      body: z.any() // The constraint body structure
    }).describe('Direct constraint object')
  ])
});

const constraintIdSchema = z.object({
  constraintId: z.string()
});

/**
 * Stores permission and constraint data in the database following proper foreign key order
 * All operations are performed within a database transaction for atomicity
 */
async function storePermissionAndConstraintInDB(
  db: DB, 
  constraint: Constraint, 
  permissionData: PermissionContract
): Promise<NonNullable<any>> {
  return await db.transaction(async (tx) => {
    // Step 1: Handle emission streams first (if needed)
    let streamsUuid: string | null = null;
    if ('Emission' in permissionData.scope && 'Streams' in permissionData.scope.Emission.allocation) {
      // Create emission stream record first
      const [streamRecord] = await tx
        .insert(emissionStreamsSchema)
        .values({
          permission_id: constraint.permId,
        })
        .returning();
      
      if (!streamRecord) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create emission stream record in database'
        });
      }
      
      streamsUuid = streamRecord.streams_uuid;
      
      // Create stream details for each stream
      const streamsMap = permissionData.scope.Emission.allocation.Streams;
      const streamDetails: Array<{
        streams_uuid: string;
        permission_id: string;
        stream_id: string;
        percentage: number;
      }> = [];
      
      for (const [streamId, percentage] of streamsMap.entries()) {
        streamDetails.push({
          streams_uuid: streamsUuid!, // Safe because we're inside the Streams allocation check
          permission_id: constraint.permId, // New required field
          stream_id: streamId,
          percentage: Number(percentage),
        });
      }
      
      await tx.insert(emissionStreamsDetailsSchema).values(streamDetails);
    }

    // Step 2: Create permission emission scope record (requires streams_uuid)
    let distributionType: 'MANUAL' | 'AUTOMATIC' | 'AT_BLOCK' | 'INTERVAL' = 'MANUAL';
    let distributionInfo: string | null = null;
    
    if ('Emission' in permissionData.scope) {
      const distribution = permissionData.scope.Emission.distribution;
      if ('Manual' in distribution) {
        distributionType = 'MANUAL';
        distributionInfo = null;
      } else if ('Automatic' in distribution) {
        distributionType = 'AUTOMATIC';
        console.log('[DEBUG] Processing Automatic distribution:', typeof distribution.Automatic, distribution.Automatic);
        distributionInfo = String(distribution.Automatic);
        console.log('[DEBUG] Converted to string:', distributionInfo);
      } else if ('AtBlock' in distribution) {
        distributionType = 'AT_BLOCK';
        distributionInfo = distribution.AtBlock.toString();
      } else if ('Interval' in distribution) {
        distributionType = 'INTERVAL';
        distributionInfo = distribution.Interval.toString();
      }
    }

    if (!streamsUuid) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Emission streams UUID is required for permission creation'
      });
    }

    const [emissionScopeRecord] = await tx
      .insert(permissionEmissionScopeSchema)
      .values({
        permission_id: constraint.permId,
        streams_uuid: streamsUuid,
        distribution_type: distributionType,
        distribution_info: distributionInfo,
        accumulating: 'Emission' in permissionData.scope ? permissionData.scope.Emission.accumulating : false,
      })
      .returning();

    if (!emissionScopeRecord) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create permission emission scope record in database'
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
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create permission record in database'
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
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create constraint record in database'
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
        scope: 'EMISSION',
        duration: 'UntilBlock' in permissionData.duration ? permissionData.duration.UntilBlock.toString() : '0',
        revocation: 'Irrevocable' in permissionData.revocation ? 0 : 1,
        execution_count: (permissionData.executionCount || 0).toString(),
        parent_id: permissionData.parent ? String(permissionData.parent) : null,
        constraint_id: constraintRecord.id,
      })
      .returning();

    console.log("permissionDetailsRecord", permissionDetailsRecord);

    // Step 6: Create enforcement authority records
    if (permissionData.enforcement && Array.isArray(permissionData.enforcement)) {
      const enforcementRecords = permissionData.enforcement.map((address: string) => ({
        permission_id: constraint.permId,
        ss58_address: address,
      }));
      
      await tx.insert(enforcementAuthoritySchema).values(enforcementRecords);
      console.log(`[TEST] Created ${enforcementRecords.length} enforcement authority records`);
    }

    return constraintRecord;
  });
}

export const constraintRouter = {
  /**
   * Add a constraint for testing (no authentication required)
   * This endpoint is for development and testing purposes only
   */
  addTest: publicProcedure
    .input(constraintInputSchema)
    .mutation(async ({ ctx, input }) => {
      let constraint: Constraint;
      
      // Parse constraint based on input type
      if (typeof input.constraint === 'string') {
        // Parse from JSON string
        const parseResult = safeParseConstraintJson(input.constraint);
        if (!parseResult.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Invalid constraint JSON: ${parseResult.error.message}`,
            cause: parseResult.error
          });
        }
        constraint = parseResult.data;
      } else {
        // Use direct object (with basic validation)
        constraint = input.constraint as Constraint;
      }

      // 1. Query permission data from blockchain using the constraint's permId
      console.log(`[TEST] Querying permission ${constraint.permId} from blockchain...`);
      const wsAPI = await ctx.wsAPI;
      // Ensure permId is a hex string
      const hexPermId = constraint.permId.startsWith('0x') ? constraint.permId as `0x${string}` : `0x${constraint.permId}` as `0x${string}`;
      const permissionResult = await queryPermission(wsAPI, hexPermId);

      // Result is a tuple [error, value] - check if error exists
      if (permissionResult[0] !== undefined) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to query permission: ${permissionResult[0]}`,
          cause: permissionResult[0]
        });
      }
      const permissionData = permissionResult[1];
      console.log(`[TEST] Permission data fetched from blockchain - contains BigInt values, skipping detailed log`);
      if(permissionData) {
        const scope = permissionData.scope;
        match(scope)({
          Emission: function (v: { allocation: Record<"Streams", Map<`0x${string}`, number>> | Record<"FixedAmount", bigint>; distribution: Record<"Manual", null> | Record<"Automatic", bigint> | Record<"AtBlock", number> | Record<"Interval", number>; targets: Map<SS58Address, bigint>; accumulating: boolean; }) {
            match(v.allocation)({
              Streams: function (streams: Map<`0x${string}`, number>) {
                console.log(`[TEST] Found Streams allocation with ${streams.size} streams`);
                return streams;
              },
              FixedAmount: function (amount: bigint) {
                throw new Error("FixedAmount allocation is not supported for constraints for now");
              }
            })
          },
          Curator: function (v: { cooldown: import("@torus-network/torus-utils").Option<number>; flags?: unknown; }): unknown {
            throw new Error("Function not implemented.");
          }
        })
      }
      
      if (!permissionData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Permission with ID "${constraint.permId}" does not exist on the Torus blockchain. Please verify the permission ID is correct and has been created on-chain before adding constraints.`
        });
      }
      
      console.log(`[TEST] Found permission data on blockchain - contains BigInt values, skipping detailed log`);

      // 2. Check if permission already exists in database
      const existingPermission = await ctx.db
        .select()
        .from(permissionSchema)
        .where(eq(permissionSchema.permission_id, constraint.permId))
        .limit(1);

      if (existingPermission.length > 0) {
        console.log(`[TEST] Permission ${constraint.permId} already exists in database, skipping database creation`);
      } else {
        // 3. Store permission and constraint data in database
        const constraintRecord = await storePermissionAndConstraintInDB(ctx.db, constraint, permissionData);
        console.log(`[TEST] Created constraint record in DB with ID: ${constraintRecord.id}`);
      }

      // 4. Get the Rete network and add constraint
      const network = getOrCreateReteNetwork();
      
      // Add constraint with automatic fact fetching
      const result = await network.addConstraintWithFacts(constraint);
      
      // Log the successful addition
      console.log(`[TEST] Added constraint ${constraint.permId} with production ID: ${result.productionId}`);
      console.log(`[TEST] Fetched ${result.fetchedFacts.length} facts from chain`);
      console.log(`[TEST] Constraint activated: ${network.isConstraintActivated(result.productionId)}`);
      
      // Simplified return to avoid BigInt serialization issues
      return {
        success: true,
        productionId: result.productionId,
        constraintId: constraint.permId,
        activated: network.isConstraintActivated(result.productionId),
        fetchedFactsCount: result.fetchedFacts.length,
        // Simplified facts without complex objects
        fetchedFactsTypes: result.fetchedFacts.map((fact: SpecificFact) => fact.type),
        // Don't return the full permissionData to avoid BigInt issues
        permissionExists: true,
      };
    }),

  /**
   * Check if a constraint is activated
   */
  checkActivation: publicProcedure
    .input(constraintIdSchema)
    .query(({ input }) => {
      const network = getOrCreateReteNetwork();
      const isActivated = network.isConstraintActivated(input.constraintId);
      
      return {
        constraintId: input.constraintId,
        activated: isActivated
      };
    }),

  /**
   * Get constraint activations (the facts that triggered the constraint)
   */
  getActivations: publicProcedure
    .input(constraintIdSchema)
    .query(({ input }) => {
      const network = getOrCreateReteNetwork();
      const activations = network.getConstraintActivations(input.constraintId);
      
      return {
        constraintId: input.constraintId,
        activationCount: activations.length,
        activations: activations.map((token: any, index: number) => ({
          activationIndex: index,
          facts: Array.from(token.facts.entries() as Iterable<[string, any]>).map(([key, fact]) => ({
            key,
            type: fact.type,
            fact
          }))
        }))
      };
    }),

  /**
   * Get network visualization for debugging
   */
  getNetworkState: publicProcedure
    .query(() => {
      const network = getOrCreateReteNetwork();
      const visualization = network.visualizeNetwork();
      
      return {
        visualization,
        timestamp: new Date().toISOString()
      };
    }),

  /**
   * Health check for the constraint system
   */
  healthCheck: publicProcedure
    .query(() => {
      const network = getOrCreateReteNetwork();
      
      return {
        status: 'healthy',
        networkInitialized: !!globalReteNetwork,
        chainWatcherInitialized: !!globalChainWatcher,
        //chainWatcherActive: globalChainWatcher?.isCurrentlyWatching() || false,
        timestamp: new Date().toISOString()
      };
    })
} satisfies TRPCRouterRecord;