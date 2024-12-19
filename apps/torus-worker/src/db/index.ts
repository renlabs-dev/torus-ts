import type { SQL, Table } from "@torus-ts/db";
import type { GovernanceModeType } from "@torus-ts/subspace";
import { getTableColumns, sql } from "@torus-ts/db";
import { db } from "@torus-ts/db/client";
import {
  cadreSchema,
  computedModuleWeightsSchema,
  daoVoteSchema,
  governanceNotificationSchema,
  moduleData,
} from "@torus-ts/db/schema";

export type NewVote = typeof daoVoteSchema.$inferInsert;
export type Module = typeof moduleData.$inferInsert;
export type ModuleWeight = typeof computedModuleWeightsSchema.$inferInsert;
export type NewNotification = typeof governanceNotificationSchema.$inferInsert;

export async function insertModuleWeight(weights: ModuleWeight[]) {
  await db
    .insert(computedModuleWeightsSchema)
    .values(
      weights.map((w) => ({
        moduleId: w.moduleId,
        stakeWeight: w.stakeWeight,
        percWeight: w.percWeight,
        atBlock: w.atBlock,
      })),
    )
    .execute();
}

export async function upsertModuleData(modules: Module[]) {
  await db
    .insert(moduleData)
    .values(
      modules.map((m) => ({
        netuid: m.netuid,
        moduleId: m.moduleId,
        moduleKey: m.moduleKey,
        name: m.name,
        atBlock: m.atBlock,
        registrationBlock: m.registrationBlock,
        addressUri: m.addressUri,
        metadataUri: m.metadataUri,
        emission: m.emission,
        incentive: m.incentive,
        dividend: m.dividend,
        delegationFee: m.delegationFee,
        totalStaked: m.totalStaked,
        totalStakers: m.totalStakers,
        totalRewards: m.totalRewards,
        isWhitelisted: m.isWhitelisted,
      })),
    )
    .onConflictDoUpdate({
      target: [moduleData.netuid, moduleData.moduleKey],
      set: buildConflictUpdateColumns(moduleData, [
        "atBlock",
        "addressUri",
        "metadataUri",
        "registrationBlock",
        "name",
        "emission",
        "incentive",
        "dividend",
        "delegationFee",
        "totalStaked",
        "totalStakers",
        "totalRewards",
        "isWhitelisted",
        "moduleId",
      ]),
    })
    .execute();
}

export interface VotesByProposal {
  daoId: number;
  acceptVotes: number;
  refuseVotes: number;
  removeVotes: number;
}

export async function vote(new_vote: NewVote) {
  await db.insert(daoVoteSchema).values(new_vote);
}

export async function addSeenProposal(proposal: NewNotification) {
  await db.insert(governanceNotificationSchema).values(proposal);
}

export async function computeTotalVotesPerDao(): Promise<VotesByProposal[]> {
  const result = await db
    .select({
      daoId: daoVoteSchema.daoId,
      acceptVotes:
        sql`count(case when ${daoVoteSchema.daoVoteType} = ${daoVoteSchema.daoVoteType.enumValues[0]} then 1 end)`.as<number>(),
      refuseVotes:
        sql`count(case when ${daoVoteSchema.daoVoteType} = ${daoVoteSchema.daoVoteType.enumValues[1]} then 1 end)`.as<number>(),
      removeVotes:
        sql`count(case when ${daoVoteSchema.daoVoteType} = ${daoVoteSchema.daoVoteType.enumValues[2]} then 1 end)`.as<number>(),
    })
    .from(daoVoteSchema)
    .where(sql`${daoVoteSchema.deletedAt} is null`)
    .groupBy(daoVoteSchema.daoId)
    .execute();

  return result;
}

export async function getProposalIdsByType(
  type: GovernanceModeType,
): Promise<number[]> {
  const result = await db
    .select({
      proposalId: governanceNotificationSchema.proposalId,
    })
    .from(governanceNotificationSchema)
    .where(sql`governance_model = ${type}`);

  const proposalIds = result.map((row) => row.proposalId);

  return proposalIds;
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
