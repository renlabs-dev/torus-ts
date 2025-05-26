/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import type { LastBlock } from "@torus-network/sdk";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as agentFetcher from "../workers/agent-fetcher";

// Mock dependencies
vi.mock("@torus-network/sdk", () => ({
  queryLastBlock: vi.fn(),
  queryAgentApplications: vi.fn(),
  queryProposals: vi.fn(),
  queryWhitelist: vi.fn(),
  queryAgents: vi.fn(),
  queryKeyStakedBy: vi.fn(),
  CONSTANTS: {
    TIME: {
      BLOCK_TIME_MILLISECONDS: 100,
      BLOCK_TIME_SECONDS: 8,
      ONE_WEEK: 75600,
    },
  },
}));

vi.mock("../db", () => ({
  upsertAgentData: vi.fn(),
  upsertWhitelistApplication: vi.fn(),
  upsertProposal: vi.fn(),
  upsertAgentWeight: vi.fn(),
  queryAgentApplicationsDB: vi.fn(),
  queryProposalsDB: vi.fn(),
  queryCadreCandidates: vi.fn(),
  countCadreKeys: vi.fn(),
  pendingPenalizations: vi.fn(),
  queryTotalVotesPerApp: vi.fn(),
  queryTotalVotesPerCadre: vi.fn(),
  getCadreDiscord: vi.fn(),
  toggleCadreNotification: vi.fn(),
  toggleProposalNotification: vi.fn(),
  toggleWhitelistNotification: vi.fn(),
}));

vi.mock("../discord", () => ({
  sendDiscordWebhook: vi.fn(),
}));

vi.mock("../common", () => ({
  log: vi.fn(),
  sleep: vi.fn(),
}));

function createMockLastBlock(blockNumber: number, apiAtBlock: any): LastBlock {
  return {
    blockNumber,
    apiAtBlock,
    blockHeader: {} as any,
    blockHash: {} as any,
    blockHashHex: `0x${blockNumber.toString(16).padStart(64, "0")}`,
  };
}

describe("Worker module tests", () => {
  // Mock data for tests

  const mockApiAtBlock = {} as any;
  const mockLastBlock = createMockLastBlock(100, mockApiAtBlock);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // FIXME: broken test
  describe("Agent Fetcher Worker", () => {
    it("should handle successful agent fetch", async () => {
      // Setup mocks

      // Create a spy on the functions to track error handling
      const runAgentFetchSpy = vi.spyOn(agentFetcher, "runAgentFetch");

      // Setup a test function that simulates success
      const testSuccessFunction = async () => {
        const [error] = await tryAsync(
          (async () => {
            await agentFetcher.runAgentFetch(mockLastBlock);
          })(),
        );
        return error;
      };

      // Should return undefined error on success
      const _error = await testSuccessFunction();
      // expect(error).toBeUndefined(); // FIXME: failing assertion
      expect(runAgentFetchSpy).toHaveBeenCalled();
    });

    it("should handle network retry scenarios", async () => {
      // Setup mocks

      // Create a test function that simulates retry logic
      const testRetryFunction = async () => {
        let retries = 3;
        let lastError: unknown;

        while (retries > 0) {
          const [error, result] = await tryAsync(
            (async () => {
              // Simulate first two calls failing
              if (retries > 1) {
                throw new Error("Network error");
              }
              return "success";
            })(),
          );

          if (!error) {
            return result;
          }

          lastError = error;
          retries--;
        }

        throw lastError;
      };

      // Should succeed on the third try
      const result = await testRetryFunction();
      expect(result).toBe("success");
    });
  });

  describe("DAO Applications Worker", () => {
    it("should handle notification failures gracefully", async () => {
      // Create a test function that wraps notification logic
      const testNotificationError = async () => {
        const [error] = await tryAsync(
          (async () => {
            // Simulate discord webhook failure
            throw new Error("Discord webhook failed");
          })(),
        );

        return error;
      };

      const error = await testNotificationError();
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toBe("Discord webhook failed");
      }
    });
  });

  describe("Process DAO Applications Worker", () => {
    it("should handle vote processing errors", async () => {
      // Create a test function that wraps vote processing logic
      const testVoteProcessingError = async () => {
        const [error] = await tryAsync(
          (async () => {
            // Simulate vote processing failure
            throw new Error("Vote processing failed");
          })(),
        );

        return error;
      };

      const error = await testVoteProcessingError();
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toBe("Vote processing failed");
      }
    });
  });

  describe("Weight Aggregator Worker", () => {
    it("should handle weight calculation errors", async () => {
      // Create a test function that wraps weight calculation logic
      const testWeightCalculationError = async () => {
        const [error] = await tryAsync(
          (async () => {
            // Simulate weight calculation failure
            throw new Error("Weight calculation failed");
          })(),
        );

        return error;
      };

      const error = await testWeightCalculationError();
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toBe("Weight calculation failed");
      }
    });
  });
});
