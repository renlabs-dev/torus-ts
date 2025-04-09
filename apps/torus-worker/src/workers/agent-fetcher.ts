import type { LastBlock, Proposal, SS58Address } from "@torus-network/sdk";
import {
  checkSS58,
  CONSTANTS,
  queryAgents,
  queryLastBlock,
  queryWhitelist,
} from "@torus-network/sdk";
import {
  tryAsyncAllWithRetries,
  tryAsyncLoggingRaw,
} from "@torus-ts/utils/error-helpers/server-operations";
import type { WorkerProps } from "../common";
import {
  agentApplicationToApplication,
  agentProposalToProposal,
  getApplications,
  getProposals,
  getProposalStatus,
  isNewBlock,
  log,
  normalizeApplicationValue,
  sleep,
} from "../common";
import type { NewApplication, NewProposal } from "../db";
import {
  queryProposalsDB,
  SubspaceAgentToDatabase,
  upsertAgentData,
  upsertProposal,
  upsertWhitelistApplication,
} from "../db";

// Constants for error handling configuration
const defaultRetries = 3;
const retryDelay = CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS;

/**
 * Fetches and processes agent data for a given block
 * @param lastBlock The latest block data
 */
export async function runAgentFetch(lastBlock: LastBlock) {
  const currentTime = new Date();
  const api = lastBlock.apiAtBlock;
  const blockNumber = lastBlock.blockNumber;

  log(`Block ${lastBlock.blockNumber}: running agent fetch`);

  // Set up our operations with specific return types
  const queryWhitelistFn = () => queryWhitelist(api);
  const queryAgentsFn = () => queryAgents(api);

  // Use tryAsyncAllWithRetries which handles logging and retries
  const result = await tryAsyncAllWithRetries(
    [queryWhitelistFn, queryAgentsFn],
    {
      retries: defaultRetries,
      delay: retryDelay,
      logLevel: "error",
    },
  );

  // Use andThen to chain operations only if the first part succeeds
  return await result.andThen(async (values) => {
    // Process the successful results
    const whitelist = new Set(values[0]);
    const agentsMapSet = values[1];
    const isWhitelisted = (addr: SS58Address) => whitelist.has(addr);
    const agents = [...agentsMapSet.values()];
    const agentsData = agents.map((agent) =>
      SubspaceAgentToDatabase(
        agent,
        blockNumber,
        isWhitelisted(checkSS58(agent.key)),
      ),
    );

    log(`Block ${lastBlock.blockNumber}: upserting ${agents.length} agents`);

    // Use tryAsyncLoggingRaw for the database operation
    const upsertResultObj = tryAsyncLoggingRaw(
      upsertAgentData(agentsData),
      "error", // Log level
    );

    // Map the result to include timing information
    return (
      await upsertResultObj.map((result) => {
        log(
          `Block ${lastBlock.blockNumber}: agent data upserted in ${(new Date().getTime() - currentTime.getTime()) / 1000} seconds`,
        );
        return result;
      })
    ).value;
  });
}

/**
 * Fetches and processes applications data for a given block
 * @param lastBlock The latest block data
 */
export async function runApplicationsFetch(lastBlock: LastBlock) {
  log(`Block ${lastBlock.blockNumber}: running applications fetch`);

  // Use tryAsyncWithRaw to log errors
  const applicationsResult = tryAsyncLoggingRaw(
    getApplications(lastBlock.apiAtBlock, (_) => true),
    "error",
  );

  // Handle potential errors from applications fetch
  return await applicationsResult.match({
    Ok: async (applications) => {
      if (!applications) {
        return applications;
      }

      // Process the applications data
      const applicationsMap = new Map(Object.entries(applications));
      const dbApplications: NewApplication[] = [];

      applicationsMap.forEach((value, _) => {
        dbApplications.push(agentApplicationToApplication(value));
      });

      log(
        `Block ${lastBlock.blockNumber}: upserting ${dbApplications.length} applications`,
      );

      // Upsert to the database
      const upsertResult = tryAsyncLoggingRaw(
        upsertWhitelistApplication(dbApplications),
        "error",
      );

      // Handle potential errors from the upsert operation
      return await upsertResult.match({
        Ok: (value) => {
          log(`Block ${lastBlock.blockNumber}: applications upserted`);
          return value;
        },
        Err: (error) => {
          // log(
          //   `Error upserting applications: ${error instanceof Error ? (error.stack ?? error.message) : JSON.stringify(error)}`,
          // );
          return error;
        },
      });
    },
    Err: (_error) => {
      return null;
    },
  });
}

/**
 * Fetches and updates proposals based on the last processed block
 * @param lastBlock The last processed block information
 * @returns Promise that resolves to the upsert result or null if there's an error
 *
 * The function:
 * 1. Queries existing proposals from DB
 * 2. Gets new proposals from blockchain for the given block
 * 3. Identifies proposals that are new or have status changes
 * 4. Upserts the identified proposals to DB
 */
export async function runProposalsFetch(lastBlock: LastBlock) {
  log(`Block ${lastBlock.blockNumber}: running proposals fetch`);

  // queryProposals
  const queryProposals = tryAsyncLoggingRaw(queryProposalsDB());

  return await queryProposals.match({
    Ok: (queryProposalsResult) => {
      const savedProposalsMap = new Map(
        queryProposalsResult.map((proposal) => [proposal.id, proposal]),
      );
      const isProposalToInsert = (a: Proposal) => {
        const existingProposal = savedProposalsMap.get(a.id);
        const isNewProposal = !existingProposal;
        const hasStatusChanged =
          !isNewProposal &&
          getProposalStatus(a) !==
            normalizeApplicationValue(existingProposal.status);
        return isNewProposal || hasStatusChanged;
      };

      // Proposal Result
      const proposalsResult = tryAsyncLoggingRaw(
        getProposals(lastBlock.apiAtBlock, isProposalToInsert),
      );
      return proposalsResult.match({
        Ok: (value) => {
          if (!value) return value;
          const proposalsMap = new Map(Object.entries(value));
          const dbProposals: NewProposal[] = [];
          proposalsMap.forEach((value, _) => {
            dbProposals.push(agentProposalToProposal(value));
          });
          log(
            `Block ${lastBlock.blockNumber}: upserting ${dbProposals.length} proposals`,
          );

          // Upsert Result
          const upsertResult = tryAsyncLoggingRaw(upsertProposal(dbProposals));
          return upsertResult.match({
            Ok: (value) => {
              log(`Block ${lastBlock.blockNumber}: proposals upserted`);
              return value;
            },
            Err: (error) => {
              return error;
            },
          });
        },
        Err: (_error) => {
          return null;
        },
      });
    },
    Err: (_error) => {
      log(`Block ${lastBlock.blockNumber}: error fetching proposals from db`);
      return null;
    },
  });
}

/**
 * Main worker function that fetches and processes block data continuously
 * @param props Worker properties including API connection
 */
export async function agentFetcherWorker(props: WorkerProps) {
  while (true) {
    // Get latest block information with error logging
    const blockResult = tryAsyncLoggingRaw(queryLastBlock(props.api), "error");

    // Handle the result of the block query
    await blockResult.match({
      Ok: async (lastBlock) => {
        // Check if the last queried block is a new block
        if (!isNewBlock(props.lastBlock.blockNumber, lastBlock.blockNumber)) {
          await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
          return;
        }

        props.lastBlock = lastBlock;
        log(`Block ${lastBlock.blockNumber}: processing`);

        // Run all data fetching and processing operations
        // We can safely use await here since they return AsyncResultObj
        await runAgentFetch(lastBlock);
        await runApplicationsFetch(lastBlock);
        await runProposalsFetch(lastBlock);
      },
      Err: async (error) => {
        log(`Error fetching last block: ${error.message}`);
        await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
      },
    });

    // Add a small delay between iterations to prevent tight loops
    await sleep(retryDelay);
  }
}
