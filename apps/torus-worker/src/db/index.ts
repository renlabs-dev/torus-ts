import type { SQL, Table } from "@torus-ts/db";
import type { GovernanceitemType } from "@torus-ts/subspace";
import { getTableColumns, sql } from "@torus-ts/db";
import { db } from "@torus-ts/db/client";
import {
  agentApplicationVoteSchema,
  agentSchema,
  cadreSchema,
  cadreVoteSchema,
  computedAgentWeightSchema,
  governanceNotificationSchema,
} from "@torus-ts/db/schema";

export type NewVote = typeof cadreVoteSchema.$inferInsert;
export type Agent = typeof agentSchema.$inferInsert;
export type AgentWeight = typeof computedAgentWeightSchema.$inferInsert;
export type NewNotification = typeof governanceNotificationSchema.$inferInsert;

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

export interface VotesByProposal {
  appId: number;
  acceptVotes: number;
  refuseVotes: number;
  removeVotes: number;
}

export async function vote(new_vote: NewVote) {
  await db.insert(cadreVoteSchema).values(new_vote);
}

export async function addSeenProposal(proposal: NewNotification) {
  await db.insert(governanceNotificationSchema).values(proposal);
}

export async function computeTotalVotesPerDao(): Promise<VotesByProposal[]> {
  const result = await db
    .select({
      appId: agentApplicationVoteSchema.applicationId,
      acceptVotes: sql<number>`count(case when ${agentApplicationVoteSchema.vote} = ${agentApplicationVoteSchema.vote.enumValues[0]} then 1 end)`,
      refuseVotes: sql<number>`count(case when ${agentApplicationVoteSchema.vote} = ${agentApplicationVoteSchema.vote.enumValues[1]} then 1 end)`,
      removeVotes: sql<number>`count(case when ${agentApplicationVoteSchema.vote} = ${agentApplicationVoteSchema.vote.enumValues[2]} then 1 end)`,
    })
    .from(agentApplicationVoteSchema)
    .where(sql`${agentApplicationVoteSchema.deletedAt} is null`)
    .groupBy(agentApplicationVoteSchema.applicationId)
    .execute();

  return result.map((row) => ({
    appId: row.appId,
    acceptVotes: row.acceptVotes,
    refuseVotes: row.refuseVotes,
    removeVotes: row.removeVotes,
    daoId: row.appId,
  }));
}

export async function getProposalIdsByType(
  type: GovernanceitemType,
): Promise<number[]> {
  const result = await db
    .select({
      itemId: governanceNotificationSchema.itemId,
    })
    .from(governanceNotificationSchema)
    .where(sql`governance_model = ${type}`);

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
