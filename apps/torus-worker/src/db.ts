import type {
  GovernanceItemType,
  SS58Address,
  Agent as TorusAgent,
} from "@torus-network/sdk";
import { checkSS58 } from "@torus-network/sdk";
import { getOrSetDefault } from "@torus-network/torus-utils/collections";
import type { SQL, Table } from "@torus-ts/db";
import {
  and,
  eq,
  getTableColumns,
  gte,
  inArray,
  isNull,
  not,
  sql,
} from "@torus-ts/db";
import { createDb } from "@torus-ts/db/client";
import {
  agentApplicationVoteSchema,
  agentSchema,
  cadreCandidateSchema,
  cadreSchema,
  cadreVoteHistory,
  cadreVoteSchema,
  candidacyStatusValues,
  computedAgentWeightSchema,
  governanceNotificationSchema,
  penalizeAgentVotesSchema,
  permissionSchema,
  permissionDetailsSchema,
  permissionEmissionScopeSchema,
  emissionStreamsSchema,
  enforcementAuthoritySchema,
  proposalSchema,
  userAgentWeightSchema,
  whitelistApplicationSchema,
} from "@torus-ts/db/schema";

const db = createDb();

export type NewVote = typeof cadreVoteSchema.$inferInsert;
export type Agent = typeof agentSchema.$inferInsert;
export type AgentWeight = typeof computedAgentWeightSchema.$inferInsert;
export type NewNotification = typeof governanceNotificationSchema.$inferInsert;
export type NewProposal = typeof proposalSchema.$inferInsert;
export type NewPermission = typeof permissionSchema.$inferInsert;
export type NewPermissionDetails = typeof permissionDetailsSchema.$inferInsert;
export type NewPermissionEmissionScope = typeof permissionEmissionScopeSchema.$inferInsert;
export type NewEmissionStream = typeof emissionStreamsSchema.$inferInsert;
export type NewEnforcementAuthority = typeof enforcementAuthoritySchema.$inferInsert;

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type NewApplication = typeof whitelistApplicationSchema.$inferInsert;
export type ApplicationDB = typeof whitelistApplicationSchema.$inferSelect;
export type CadreCandidate = typeof cadreCandidateSchema.$inferSelect;

export async function upsertAgentWeight(weights: AgentWeight[]) {
  await db
    .insert(computedAgentWeightSchema)
    .values(
      weights.map((w) => ({
        atBlock: w.atBlock,
        agentKey: w.agentKey,
        computedWeight: w.computedWeight,
        percComputedWeight: w.percComputedWeight,
      })),
    )
    .onConflictDoUpdate({
      target: [computedAgentWeightSchema.agentKey],
      set: buildConflictUpdateColumns(computedAgentWeightSchema, [
        "atBlock",
        "computedWeight",
        "percComputedWeight",
      ]),
    })
    .execute();
}

export async function upsertWhitelistApplication(
  applications: NewApplication[],
) {
  await db
    .insert(whitelistApplicationSchema)
    .values(
      applications.map((a) => ({
        agentKey: a.agentKey,
        payerKey: a.payerKey,
        status: a.status,
        expiresAt: a.expiresAt,
        cost: a.cost,
        data: a.data,
      })),
    )
    .onConflictDoUpdate({
      target: [whitelistApplicationSchema.agentKey],
      set: buildConflictUpdateColumns(whitelistApplicationSchema, [
        "status",
        "notified",
      ]),
    })
    .execute();
}

export async function upsertProposal(proposals: NewProposal[]) {
  if (proposals.length === 0) return;
  await db
    .insert(proposalSchema)
    .values(
      proposals.map((a) => ({
        expirationBlock: a.expirationBlock,
        status: a.status,
        proposerKey: a.proposerKey,
        creationBlock: a.creationBlock,
        metadataUri: a.metadataUri,
        proposalCost: a.proposalCost,
        proposalID: a.proposalID,
      })),
    )
    .onConflictDoUpdate({
      target: [proposalSchema.proposalID],
      set: { status: proposalSchema.status, notified: false },
    })
    .execute();
}

export async function upsertAgentData(agents: Agent[]) {
  await db
    .insert(agentSchema)
    .values(
      agents.map((a) => ({
        key: a.key,
        name: a.name,
        atBlock: a.atBlock,
        registrationBlock: a.registrationBlock,
        apiUrl: a.apiUrl,
        metadataUri: a.metadataUri,
        weightFactor: a.weightFactor,
        isWhitelisted: a.isWhitelisted,
        totalStaked: a.totalStaked,
        totalStakers: a.totalStakers,
      })),
    )
    .onConflictDoUpdate({
      target: [agentSchema.key],
      set: buildConflictUpdateColumns(agentSchema, [
        "atBlock",
        "name",
        "apiUrl",
        "metadataUri",
        "registrationBlock",
        "weightFactor",
        "isWhitelisted",
        "totalStaked",
        "totalStakers",
      ]),
    })
    .execute();
}

interface VotesByIdBase {
  acceptVotes: number;
  refuseVotes: number;
  removeVotes: number;
}

export interface VotesByNumericId extends VotesByIdBase {
  appId: number;
}

export interface VotesByKey extends VotesByIdBase {
  appId: SS58Address;
}

export async function vote(new_vote: NewVote) {
  await db.insert(cadreVoteSchema).values(new_vote);
}

export async function toggleWhitelistNotification(proposal: ApplicationDB) {
  await db
    .update(whitelistApplicationSchema)
    .set({ notified: true })
    .where(eq(whitelistApplicationSchema.id, proposal.id))
    .execute();
}

export async function toggleCadreNotification(candidate: CadreCandidate) {
  await db
    .update(cadreCandidateSchema)
    .set({ notified: true })
    .where(eq(cadreCandidateSchema.userKey, candidate.userKey))
    .execute();
}

export async function toggleProposalNotification(proposal: NewProposal) {
  await db
    .update(proposalSchema)
    .set({ notified: true })
    .where(eq(proposalSchema.proposalID, proposal.proposalID))
    .execute();
}

export async function queryTotalVotesPerApp(): Promise<VotesByNumericId[]> {
  const result = await db
    .select({
      appId: agentApplicationVoteSchema.applicationId,
      acceptVotes: sql<number>`count(case when ${agentApplicationVoteSchema.vote} = ${agentApplicationVoteSchema.vote.enumValues[0]} then 1 end)`,
      refuseVotes: sql<number>`count(case when ${agentApplicationVoteSchema.vote} = ${agentApplicationVoteSchema.vote.enumValues[1]} then 1 end)`,
      removeVotes: sql<number>`count(case when ${agentApplicationVoteSchema.vote} = ${agentApplicationVoteSchema.vote.enumValues[2]} then 1 end)`,
    })
    .from(agentApplicationVoteSchema)
    .where(isNull(agentApplicationVoteSchema.deletedAt))
    .groupBy(agentApplicationVoteSchema.applicationId)
    .execute();

  return result.map((row) => ({
    appId: row.appId,
    acceptVotes: row.acceptVotes,
    refuseVotes: row.refuseVotes,
    removeVotes: row.removeVotes,
    agentId: row.appId,
  }));
}

export async function queryAgentApplicationsDB(): Promise<ApplicationDB[]> {
  const result = await db
    .select()
    .from(whitelistApplicationSchema)
    .where(and(isNull(whitelistApplicationSchema.deletedAt)))
    .execute();

  return result;
}

export async function queryProposalsDB(): Promise<NewProposal[]> {
  const result = await db
    .select()
    .from(proposalSchema)
    .where(and(isNull(proposalSchema.deletedAt)))
    .execute();

  return result;
}

export async function getCadreDiscord(cadreKey: SS58Address) {
  const result = await db
    .select({
      discordId: cadreCandidateSchema.discordId,
    })
    .from(cadreCandidateSchema)
    .where(
      and(
        isNull(cadreCandidateSchema.deletedAt),
        eq(cadreCandidateSchema.userKey, cadreKey),
      ),
    )
    .limit(1)
    .execute();

  return result.pop()?.discordId;
}

export async function queryCadreCandidates() {
  const result = await db
    .select()
    .from(cadreCandidateSchema)
    .where(isNull(cadreCandidateSchema.deletedAt));
  return result;
}

export async function queryTotalVotesPerCadre(): Promise<VotesByKey[]> {
  const result = await db
    .select({
      appId: cadreVoteSchema.applicantKey,
      acceptVotes: sql<number>`count(case when ${cadreVoteSchema.vote} = ${cadreVoteSchema.vote.enumValues[0]} then 1 end)`,
      refuseVotes: sql<number>`count(case when ${cadreVoteSchema.vote} = ${cadreVoteSchema.vote.enumValues[1]} then 1 end)`,
      removeVotes: sql<number>`count(case when ${cadreVoteSchema.vote} = ${cadreVoteSchema.vote.enumValues[2]} then 1 end)`,
    })
    .from(cadreVoteSchema)
    .where(isNull(cadreVoteSchema.deletedAt))
    .groupBy(cadreVoteSchema.applicantKey)
    .execute();

  return result.map((row) => ({
    appId: checkSS58(row.appId),
    acceptVotes: row.acceptVotes,
    refuseVotes: row.refuseVotes,
    removeVotes: row.removeVotes,
  }));
}

export async function archiveCadreVotes(
  applicantKey: SS58Address,
  tx: Transaction,
) {
  const votes = await tx
    .select()
    .from(cadreVoteSchema)
    .where(eq(cadreVoteSchema.applicantKey, applicantKey));

  await tx.insert(cadreVoteHistory).values(
    votes.map((vote) => ({
      userKey: vote.userKey,
      applicantKey: vote.applicantKey,
      vote: vote.vote,
      createdAt: vote.createdAt, // Explicit to keep history
      updatedAt: vote.updatedAt,
    })),
  );

  await tx
    .delete(cadreVoteSchema)
    .where(eq(cadreVoteSchema.applicantKey, applicantKey));
}

export async function addCadreMember(userKey: SS58Address, discordId: string) {
  await db.transaction(async (tx) => {
    await tx.insert(cadreSchema).values({
      userKey: userKey,
      discordId: discordId,
    });
    await tx
      .update(cadreCandidateSchema)
      .set({
        candidacyStatus: candidacyStatusValues.ACCEPTED,
        notified: false,
      })
      .where(eq(cadreCandidateSchema.userKey, userKey));

    await archiveCadreVotes(userKey, tx);
  });
}

export async function removeCadreMember(userKey: SS58Address) {
  await db.transaction(async (tx) => {
    await archiveCadreVotes(userKey, tx);
    await tx.delete(cadreSchema).where(eq(cadreSchema.userKey, userKey));
    await tx
      .update(cadreCandidateSchema)
      .set({
        candidacyStatus: candidacyStatusValues.REMOVED,
        notified: false,
      })
      .where(eq(cadreCandidateSchema.userKey, userKey));
  });
}

export async function refuseCadreApplication(userKey: SS58Address) {
  await db.transaction(async (tx) => {
    await tx
      .update(cadreCandidateSchema)
      .set({ candidacyStatus: candidacyStatusValues.REJECTED, notified: false })
      .where(eq(cadreCandidateSchema.userKey, userKey));

    await archiveCadreVotes(userKey, tx);
  });
}

export async function getGovItemIdsByType(
  type: GovernanceItemType,
): Promise<number[]> {
  const result = await db
    .select({
      itemId: governanceNotificationSchema.itemId,
    })
    .from(governanceNotificationSchema)
    .where(eq(governanceNotificationSchema.itemType, type));

  const itemIds = result.map((row) => row.itemId);

  return itemIds;
}

export async function countCadreKeys(): Promise<number> {
  const result = await db
    .select({
      count: sql`count(*)`.as<number>(),
    })
    .from(cadreSchema)
    .where(sql`${cadreSchema.deletedAt} is null`)
    .execute();

  if (!result[0]) {
    return 0;
  }

  return result[0].count;
}

export async function pendingPenalizations(threshold: number, n: number) {
  const agentsWithUnexecutedVotes = db
    .select({ agentKey: penalizeAgentVotesSchema.agentKey })
    .from(penalizeAgentVotesSchema)
    .where(not(penalizeAgentVotesSchema.executed));

  const result = await db
    .with(agentsWithUnexecutedVotes.as("agents_with_unexecuted_votes"))
    .select({
      agentKey: penalizeAgentVotesSchema.agentKey,
      nthBiggestPenaltyFactor: sql`
        (
          SELECT penalty_factor
          FROM ${penalizeAgentVotesSchema} as inner_p
          WHERE 
            inner_p.agent_key = ${penalizeAgentVotesSchema.agentKey}
          ORDER BY penalty_factor DESC
          LIMIT 1 OFFSET ${n - 1}
        )
      `.as<number>(),
    })
    .from(penalizeAgentVotesSchema)
    .where(
      sql`${penalizeAgentVotesSchema.agentKey} in (select "agent_key" from agents_with_unexecuted_votes)`,
    )
    .groupBy(penalizeAgentVotesSchema.agentKey)
    .having(gte(sql`count(*)`, threshold));

  const castedResult = result.map((row) => ({
    agentKey: checkSS58(row.agentKey),
    nthBiggestPenaltyFactor: row.nthBiggestPenaltyFactor,
  }));
  return castedResult;
}

export async function getAgentKeysWithPenalties() {
  const result = await db
    .select({
      agentKey: penalizeAgentVotesSchema.agentKey,
      count: sql`count(*)`.as<number>(),
    })
    .from(penalizeAgentVotesSchema)
    .where(not(penalizeAgentVotesSchema.executed))
    .groupBy(penalizeAgentVotesSchema.agentKey)
    .execute();

  return result;
}

export async function updatePenalizeAgentVotes(agentKeys: string[]) {
  await db
    .update(penalizeAgentVotesSchema)
    .set({
      executed: true,
    })
    .where(inArray(penalizeAgentVotesSchema.agentKey, agentKeys))
    .execute();
}

// util for upsert https://orm.drizzle.team/learn/guides/upsert#postgresql-and-sqlite
function buildConflictUpdateColumns<
  T extends Table,
  Q extends keyof T["_"]["columns"],
>(table: T, columns: Q[]): Record<Q, SQL> {
  const cls = getTableColumns(table);
  return columns.reduce(
    (acc, column) => {
      const colName = cls[column]?.name;
      acc[column] = sql.raw(`excluded.${colName}`);
      return acc;
    },
    {} as Record<Q, SQL>,
  );
}

export function SubspaceAgentToDatabase(
  agent: TorusAgent,
  atBlock: number,
  whitelisted: boolean,
): Agent {
  return {
    // Insertion timestamp
    atBlock: atBlock,

    // Actual identifier
    key: agent.key,
    name: agent.name,
    apiUrl: agent.url,
    metadataUri: agent.metadata,
    weightFactor: agent.weightPenaltyFactor,

    isWhitelisted: whitelisted,
    registrationBlock: atBlock,

    totalStaked: 0n,
    totalStakers: 0,
  };
}

/**
 * Queries the user-module data table to build a mapping of user keys to
 * module keys to weights.
 *
 * @returns user key -> module id -> weight (0–100)
 */
export async function getUserWeightMap(): Promise<
  Map<string, Map<string, bigint>>
> {
  const result = await db
    .select({
      userKey: userAgentWeightSchema.userKey,
      weight: userAgentWeightSchema.weight,
      agentKey: agentSchema.key,
    })
    .from(agentSchema)
    // filter agents updated on the last seen block
    .where(
      and(
        eq(agentSchema.atBlock, sql`(SELECT MAX(at_block) FROM agent)`),
        eq(agentSchema.isWhitelisted, true),
      ),
    )
    .innerJoin(
      userAgentWeightSchema,
      eq(agentSchema.key, userAgentWeightSchema.agentKey),
    )
    .execute();
  const weightMap = new Map<string, Map<string, bigint>>();
  for (const entry of result) {
    const { userKey, agentKey, weight } = entry;
    const userWeightMap = getOrSetDefault(weightMap, userKey, () => new Map());
    userWeightMap.set(agentKey, BigInt(Math.round(weight)));
  }
  return weightMap;
}

export async function upsertPermissions(permissions: {
  permission: NewPermission;
  details: NewPermissionDetails; 
  emissionScope?: NewPermissionEmissionScope;
  emissionStream?: NewEmissionStream;
  enforcementAuthorities?: NewEnforcementAuthority[];
}[]) {
  await db.transaction(async (tx) => {
    for (const { permission, details, emissionScope, emissionStream, enforcementAuthorities } of permissions) {
      
      // STEP 1: Insert emissionStreamsSchema first (this is referenced by other tables)
      let actualStreamsUuid: string | undefined;
      if (emissionStream) {
        const streamResult = await tx
          .insert(emissionStreamsSchema)
          .values(emissionStream)
          .onConflictDoNothing({
            target: [emissionStreamsSchema.permission_id],
          })
          .returning({ streams_uuid: emissionStreamsSchema.streams_uuid });
        
        if (streamResult.length > 0) {
          actualStreamsUuid = streamResult[0]?.streams_uuid;
        } else {
          // If conflict, query existing record to get the UUID
          const existingStream = await tx
            .select({ streams_uuid: emissionStreamsSchema.streams_uuid })
            .from(emissionStreamsSchema)
            .where(eq(emissionStreamsSchema.permission_id, permission.permission_id))
            .limit(1);
          actualStreamsUuid = existingStream[0]?.streams_uuid;
        }
      }
      
      // STEP 2: Insert permissionEmissionScopeSchema (references emissionStreamsSchema)
      if (emissionScope && actualStreamsUuid) {
        await tx
          .insert(permissionEmissionScopeSchema)
          .values({
            ...emissionScope,
            streams_uuid: actualStreamsUuid, // Use the actual auto-generated UUID
          })
          .onConflictDoNothing({
            target: [permissionEmissionScopeSchema.permission_id],
          });
      }
      
      // STEP 3: Insert permission (references permissionEmissionScopeSchema)
      await tx
        .insert(permissionSchema)
        .values(permission)
        .onConflictDoNothing({
          target: [permissionSchema.permission_id],
        });

      // STEP 4: Insert permission details (references permissionSchema)
      await tx
        .insert(permissionDetailsSchema)
        .values(details)
        .onConflictDoNothing({
          target: [permissionDetailsSchema.permission_id],
        });

      // STEP 5: Insert enforcement authorities (references permissionSchema)
      if (enforcementAuthorities && enforcementAuthorities.length > 0) {
        await tx
          .insert(enforcementAuthoritySchema)
          .values(enforcementAuthorities)
          .onConflictDoNothing();
      }
    }
  });
}
