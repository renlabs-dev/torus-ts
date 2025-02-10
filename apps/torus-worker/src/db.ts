import type { SQL, Table } from "@torus-ts/db";
import {
  and,
  eq,
  getTableColumns,
  isNull,
  sql,
  gte,
  inArray,
  not,
} from "@torus-ts/db";
import { createDb } from "@torus-ts/db/client";
import {
  agentApplicationVoteSchema,
  agentSchema,
  cadreSchema,
  cadreVoteSchema,
  cadreVoteHistory,
  computedAgentWeightSchema,
  governanceNotificationSchema,
  userAgentWeightSchema,
  penalizeAgentVotesSchema,
  cadreCandidateSchema,
  candidacyStatusValues,
  whitelistApplicationSchema,
} from "@torus-ts/db/schema";
import type {
  Agent as TorusAgent,
  GovernanceItemType,
  SS58Address,
} from "@torus-ts/subspace";
import { checkSS58 } from "@torus-ts/subspace";
import { getOrSetDefault } from "@torus-ts/utils/collections";

const db = createDb();

export type NewVote = typeof cadreVoteSchema.$inferInsert;
export type Agent = typeof agentSchema.$inferInsert;
export type AgentWeight = typeof computedAgentWeightSchema.$inferInsert;
export type NewNotification = typeof governanceNotificationSchema.$inferInsert;
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Application = typeof whitelistApplicationSchema.$inferInsert;
export type ApplicationDB = typeof whitelistApplicationSchema.$inferSelect;

export async function insertAgentWeight(weights: AgentWeight[]) {
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
    .execute();
}

export async function upsertWhitelistApplication(applications: Application[]) {
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
  .where(eq(whitelistApplicationSchema.id, (proposal.id)))
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
    .where(
      and(
        isNull(whitelistApplicationSchema.deletedAt),
      ))
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
      .set({ candidacyStatus: candidacyStatusValues.REMOVED })
      .where(eq(cadreCandidateSchema.userKey, userKey));
  });
}

export async function refuseCadreApplication(userKey: SS58Address) {
  await db.transaction(async (tx) => {
    await tx
      .update(cadreCandidateSchema)
      .set({ candidacyStatus: candidacyStatusValues.REJECTED })
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
  const subquery = db
    .select({ agentKey: penalizeAgentVotesSchema.agentKey })
    .from(penalizeAgentVotesSchema)
    .where(not(penalizeAgentVotesSchema.executed))
    .groupBy(penalizeAgentVotesSchema.agentKey)
    .having(gte(sql`count(*)`, threshold));

  const result = await db
    .with(subquery.as("subquery"))
    .select({
      agentKey: penalizeAgentVotesSchema.agentKey,
      nthBiggestPenaltyFactor: sql`
        (
          SELECT penalty_factor
          FROM ${penalizeAgentVotesSchema} as inner_p
          WHERE 
            inner_p.agent_key = ${penalizeAgentVotesSchema.agentKey} AND
            NOT inner_p.executed
          ORDER BY penalty_factor DESC
          LIMIT 1 OFFSET ${n - 1}
        )
      `.as<number>(),
    })
    .from(penalizeAgentVotesSchema)
    .where(
      and(
        not(penalizeAgentVotesSchema.executed),
        sql`${penalizeAgentVotesSchema.agentKey} in (select "agent_key" from subquery)`,
      ),
    )
    .groupBy(penalizeAgentVotesSchema.agentKey);

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
