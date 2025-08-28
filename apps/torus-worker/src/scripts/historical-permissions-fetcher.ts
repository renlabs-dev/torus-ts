#!/usr/bin/env node

import { ApiPromise, WsProvider } from "@polkadot/api";
import fs from "fs/promises";
import path from "path";

import { match } from "rustie";

import type {
  AccumulatedStreamEntry,
  EmissionScope,
  PermissionContract,
  PermissionId,
} from "@torus-network/sdk/chain";
import {
  queryAllAccumulatedStreamAmounts,
  queryPermissions,
} from "@torus-network/sdk/chain";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import type { SS58Address } from "@torus-network/sdk/types";
import { sb_blocks } from "@torus-network/sdk/types";
import superjson from "superjson";

// Import the inferred types from schema - now this will work!
import type {
  accumulatedStreamAmountsSchema,
  emissionDistributionTargetsSchema,
  emissionPermissionsSchema,
  emissionStreamAllocationsSchema,
  permissionsSchema,
} from "@torus-ts/db/schema";

const log = BasicLogger.create({ name: "historical-permissions-fetcher" });

// Configuration
const ARCHIVE_NODE_URL = "wss://archive.torus.network";
const BLOCK_JUMP = 41; // Jump 41 blocks each iteration
const BLOCKS_TO_GO_BACK = 200; // Approximately 3 months
const CHECKPOINT_FILE = "checkpoint.json";
const CSV_BATCH_SIZE = 1000; // Write CSV in batches
const CSV_OUTPUT_DIR = "historical-data";

// Use inferred types from schema - extend with block context for CSV
type PermissionInsert = typeof permissionsSchema.$inferInsert;
type EmissionPermissionInsert = typeof emissionPermissionsSchema.$inferInsert;
type StreamAllocationInsert =
  typeof emissionStreamAllocationsSchema.$inferInsert;
type DistributionTargetInsert =
  typeof emissionDistributionTargetsSchema.$inferInsert;
type AccumulatedStreamInsert =
  typeof accumulatedStreamAmountsSchema.$inferInsert;

// Historical data types (add block context for CSV)
interface HistoricalPermissionData
  extends Omit<PermissionInsert, "id" | "createdAt" | "updatedAt"> {
  blockNumber: number;
  blockHash: string;
}

interface HistoricalEmissionData
  extends Omit<EmissionPermissionInsert, "createdAt" | "updatedAt"> {
  blockNumber: number;
  blockHash: string;
}

interface HistoricalStreamAllocationData extends StreamAllocationInsert {
  blockNumber: number;
  blockHash: string;
}

interface HistoricalDistributionTargetData extends DistributionTargetInsert {
  blockNumber: number;
  blockHash: string;
}

interface HistoricalAccumulatedStreamData
  extends Omit<AccumulatedStreamInsert, "lastUpdated"> {
  blockNumber: number;
  blockHash: string;
}

interface Checkpoint {
  currentBlock: number;
  targetBlock: number;
  processedBlocks: number[];
}

class HistoricalPermissionsFetcher {
  private api!: ApiPromise;
  private checkpointPath: string;
  private csvDir: string;
  private permissionsBatch: HistoricalPermissionData[] = [];
  private emissionsBatch: HistoricalEmissionData[] = [];
  private streamAllocationsBatch: HistoricalStreamAllocationData[] = [];
  private distributionTargetsBatch: HistoricalDistributionTargetData[] = [];
  private accumulatedStreamsBatch: HistoricalAccumulatedStreamData[] = [];

  constructor() {
    this.checkpointPath = path.join(process.cwd(), CHECKPOINT_FILE);
    this.csvDir = path.join(process.cwd(), CSV_OUTPUT_DIR);
  }

  async initialize(): Promise<void> {
    log.info("Connecting to archive node...");

    try {
      const provider = new WsProvider(ARCHIVE_NODE_URL, 10000); // 10 second timeout
      log.info("WsProvider created, connecting...");

      this.api = await ApiPromise.create({ provider });
      log.info("ApiPromise created, waiting for ready...");

      await this.api.isReady;
      log.info("API is ready!");

      // Create output directory
      await fs.mkdir(this.csvDir, { recursive: true });
      log.info("Output directory created");

      // Initialize CSV files with headers
      await this.initializeCsvFiles();
      log.info("CSV files initialized");

      log.info("Connected to archive node successfully");
    } catch (error) {
      log.error("Failed to connect to archive node:", error);
      throw error;
    }
  }

  async initializeCsvFiles(): Promise<void> {
    const files = {
      "permissions.csv": [
        "blockNumber",
        "blockHash",
        "permissionId",
        "grantorAccountId",
        "granteeAccountId",
        "durationType",
        "durationBlockNumber",
        "revocationType",
        "revocationBlockNumber",
        "revocationRequiredVotes",
        "enforcementType",
        "enforcementRequiredVotes",
        "lastExecutionBlock",
        "executionCount",
        "createdAtBlock",
      ],
      "emissions.csv": [
        "blockNumber",
        "blockHash",
        "permissionId",
        "allocationType",
        "fixedAmount",
        "distributionType",
        "distributionThreshold",
        "distributionTargetBlock",
        "distributionIntervalBlocks",
        "accumulating",
      ],
      "stream_allocations.csv": [
        "blockNumber",
        "blockHash",
        "permissionId",
        "streamId",
        "percentage",
      ],
      "distribution_targets.csv": [
        "blockNumber",
        "blockHash",
        "permissionId",
        "streamId",
        "targetAccountId",
        "weight",
        "accumulatedTokens",
        "atBlock",
      ],
      "accumulated_streams.csv": [
        "blockNumber",
        "blockHash",
        "grantorAccountId",
        "streamId",
        "permissionId",
        "accumulatedAmount",
        "lastExecutedBlock",
        "atBlock",
        "executionCount",
      ],
    };

    for (const [filename, headers] of Object.entries(files)) {
      await fs.writeFile(
        path.join(this.csvDir, filename),
        headers.join(",") + "\n",
      );
    }
  }

  async loadCheckpoint(): Promise<Checkpoint | null> {
    try {
      const data = await fs.readFile(this.checkpointPath, "utf-8");
      return JSON.parse(data) as Checkpoint;
    } catch {
      log.info("No checkpoint found, starting fresh");
      return null;
    }
  }

  async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    await fs.writeFile(
      this.checkpointPath,
      JSON.stringify(checkpoint, null, 2),
    );
  }

  async getCurrentBlock(): Promise<number> {
    const [headerError, blockHeader] = await tryAsync(
      this.api.rpc.chain.getHeader(),
    );
    if (headerError !== undefined) {
      throw new Error(`Failed to get current block: ${headerError.message}`);
    }

    const [parseError, blockNumber] = trySync(() =>
      sb_blocks.parse(blockHeader.number),
    );
    if (parseError !== undefined) {
      throw new Error(`Failed to parse block number: ${parseError.message}`);
    }

    return blockNumber;
  }

  async processBlock(blockNumber: number): Promise<void> {
    log.info(`Processing block ${blockNumber}...`);

    // Get block hash
    const [hashError, blockHash] = await tryAsync(
      this.api.rpc.chain.getBlockHash(blockNumber),
    );
    if (hashError !== undefined) {
      log.error(
        `Failed to get block hash for block ${blockNumber}: ${hashError.message}`,
      );
      return;
    }

    // Create API instance at this block
    const [apiError, apiAtBlock] = await tryAsync(this.api.at(blockHash));
    if (apiError !== undefined) {
      log.error(
        `Failed to get API at block ${blockNumber}: ${apiError.message}`,
      );
      return;
    }

    const blockHashHex = blockHash.toHex();

    try {
      // Query permissions at this block
      const permissionsResult = await queryPermissions(apiAtBlock);
      const [permissionsErr, permissionsMap] = permissionsResult;
      if (permissionsErr) {
        log.error(
          `Failed to query permissions at block ${blockNumber}: ${permissionsErr.message}`,
        );
        return;
      }

      // Filter to only emission permissions
      const emissionPermissions = new Map<PermissionId, PermissionContract>();
      for (const [permissionId, contract] of permissionsMap.entries()) {
        if ("Emission" in contract.scope) {
          emissionPermissions.set(permissionId, contract);
        }
      }

      if (emissionPermissions.size === 0) {
        log.info(
          `Block ${blockNumber}: no emission permissions found, skipping`,
        );
        return;
      }

      // Query accumulated stream amounts at this block
      const streamAccumulationsResult =
        await queryAllAccumulatedStreamAmounts(apiAtBlock);
      const [streamAccumulationsErr, streamAccumulations] =
        streamAccumulationsResult;
      if (streamAccumulationsErr) {
        log.error(
          `Failed to query stream accumulations at block ${blockNumber}: ${streamAccumulationsErr.message}`,
        );
        return;
      }

      log.info(
        `Block ${blockNumber}: found ${emissionPermissions.size} emission permissions and ${streamAccumulations.length} stream accumulations`,
      );

      // Process emission permissions
      for (const [permissionId, contract] of emissionPermissions.entries()) {
        this.processEmissionPermission(
          blockNumber,
          blockHashHex,
          permissionId,
          contract,
          streamAccumulations,
        );
      }

      // Process accumulated streams (only for emission permissions)
      for (const accumulation of streamAccumulations) {
        const permission = emissionPermissions.get(accumulation.permissionId);
        if (permission) {
          this.accumulatedStreamsBatch.push({
            blockNumber,
            blockHash: blockHashHex,
            grantorAccountId: accumulation.delegator,
            streamId: accumulation.streamId,
            permissionId: accumulation.permissionId,
            accumulatedAmount: accumulation.amount.toString(),
            lastExecutedBlock: match(permission.lastExecution)({
              Some: (block) => Number(block.toString()),
              None: () => null,
            }),
            atBlock: blockNumber,
            executionCount: Number(permission.executionCount.toString()),
          });
        }
      }

      // Check if we need to flush batches
      if (this.permissionsBatch.length >= CSV_BATCH_SIZE) {
        await this.flushBatches();
      }
    } catch (error) {
      log.error(`Failed to process block ${blockNumber}:`, error);
    }
  }

  processEmissionPermission(
    blockNumber: number,
    blockHash: string,
    permissionId: PermissionId,
    contract: PermissionContract,
    streamAccumulations: AccumulatedStreamEntry[],
  ): void {
    // Map basic permission data with ALL required fields
    const durationType = match(contract.duration)({
      Indefinite: () => "indefinite" as const,
      UntilBlock: () => "until_block" as const,
    });

    const durationBlockNumber = match(contract.duration)({
      Indefinite: () => null,
      UntilBlock: (block) => BigInt(block.toString()),
    });

    const revocationType = match(contract.revocation)({
      Irrevocable: () => "irrevocable" as const,
      RevocableByDelegator: () => "revocable_by_delegator" as const,
      RevocableByArbiters: () => "revocable_by_arbiters" as const,
      RevocableAfter: () => "revocable_after" as const,
    });

    const revocationBlockNumber = match(contract.revocation)({
      RevocableAfter: (block) => BigInt(block.toString()),
      Irrevocable: () => null,
      RevocableByDelegator: () => null,
      RevocableByArbiters: () => null,
    });

    const revocationRequiredVotes = match(contract.revocation)({
      RevocableByArbiters: (arbiters) =>
        BigInt(arbiters.requiredVotes.toString()),
      Irrevocable: () => null,
      RevocableByDelegator: () => null,
      RevocableAfter: () => null,
    });

    const enforcementType = match(contract.enforcement)({
      None: () => "none" as const,
      ControlledBy: () => "controlled_by" as const,
    });

    const enforcementRequiredVotes = match(contract.enforcement)({
      ControlledBy: (controlled) => BigInt(controlled.requiredVotes.toString()),
      None: () => null,
    });

    // Create base permission record with ALL fields
    const permissionData: HistoricalPermissionData = {
      blockNumber,
      blockHash,
      permissionId: permissionId,
      grantorAccountId: contract.delegator,
      granteeAccountId: contract.recipient,
      durationType,
      durationBlockNumber,
      revocationType,
      revocationBlockNumber,
      revocationRequiredVotes,
      enforcementType,
      enforcementRequiredVotes,
      lastExecutionBlock: match(contract.lastExecution)({
        Some: (block) => BigInt(block.toString()),
        None: () => null,
      }),
      executionCount: Number(contract.executionCount.toString()),
      createdAtBlock: BigInt(contract.createdAt.toString()),
    };

    this.permissionsBatch.push(permissionData);

    // Process emission scope - we know it's emission type since we filtered above
    if ("Emission" in contract.scope) {
      const emission = contract.scope.Emission as EmissionScope;
      this.processEmissionScope(
        blockNumber,
        blockHash,
        permissionId,
        emission,
        contract.delegator,
        streamAccumulations,
      );
    }
  }

  processEmissionScope(
    blockNumber: number,
    blockHash: string,
    permissionId: PermissionId,
    emission: EmissionScope,
    delegator: SS58Address,
    streamAccumulations: AccumulatedStreamEntry[],
  ): void {
    const allocationType = match(emission.allocation)({
      Streams: () => "streams" as const,
      FixedAmount: () => "fixed_amount" as const,
    });

    const distributionType = match(emission.distribution)({
      Manual: () => "manual" as const,
      Automatic: () => "automatic" as const,
      AtBlock: () => "at_block" as const,
      Interval: () => "interval" as const,
    });

    const distributionThreshold = match(emission.distribution)({
      Automatic: (auto) => auto.toString(),
      Manual: () => null,
      AtBlock: () => null,
      Interval: () => null,
    });

    const distributionTargetBlock = match(emission.distribution)({
      AtBlock: (atBlock) => BigInt(atBlock.toString()),
      Manual: () => null,
      Automatic: () => null,
      Interval: () => null,
    });

    const distributionIntervalBlocks = match(emission.distribution)({
      Interval: (interval) => BigInt(interval.toString()),
      Manual: () => null,
      Automatic: () => null,
      AtBlock: () => null,
    });

    const fixedAmount = match(emission.allocation)({
      FixedAmount: (amount) => amount.toString(),
      Streams: () => null,
    });

    // Add emission permission record
    this.emissionsBatch.push({
      blockNumber,
      blockHash,
      permissionId: permissionId,
      allocationType,
      fixedAmount,
      distributionType,
      distributionThreshold,
      distributionTargetBlock,
      distributionIntervalBlocks,
      accumulating: emission.accumulating,
    });

    // Process stream allocations
    const streamAllocations = match(emission.allocation)({
      Streams: (streams: Map<string, number>) =>
        Array.from(streams.entries()).map(([streamId, percentage]) => ({
          blockNumber,
          blockHash,
          permissionId: permissionId,
          streamId: streamId,
          percentage: percentage,
        })),
      FixedAmount: () => [],
    });

    this.streamAllocationsBatch.push(...streamAllocations);

    // Process distribution targets
    const accumulationLookup = new Map<string, bigint>();
    for (const accumulation of streamAccumulations) {
      const key = `${accumulation.delegator}-${accumulation.streamId}-${accumulation.permissionId}`;
      accumulationLookup.set(key, accumulation.amount);
    }

    // Process each stream separately to normalize weights per (permissionId, streamId) pair
    for (const streamAllocation of streamAllocations) {
      // Calculate total weight for this specific (permissionId, streamId) pair
      const totalWeightForThisStream = Array.from(
        emission.targets.values(),
      ).reduce((sum, weight) => sum + weight, BigInt(0));

      // Get accumulated amount for this specific stream
      const lookupKey = `${delegator}-${streamAllocation.streamId}-${permissionId}`;
      const totalAccumulatedForStream =
        accumulationLookup.get(lookupKey) ?? BigInt(0);

      // Distribute to each target based on their normalized weight for this stream
      for (const [accountId, weight] of emission.targets.entries()) {
        const accumulatedTokens =
          totalWeightForThisStream > BigInt(0)
            ? (weight * totalAccumulatedForStream) / totalWeightForThisStream
            : BigInt(0);

        this.distributionTargetsBatch.push({
          blockNumber,
          blockHash,
          permissionId: permissionId,
          streamId: streamAllocation.streamId,
          targetAccountId: accountId,
          weight: Number(weight.toString()),
          accumulatedTokens: accumulatedTokens.toString(),
          atBlock: blockNumber,
        });
      }
    }
  }

  private formatCsvValue(value: unknown): string {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "string") {
      return `"${value.replace(/"/g, '""')}"`;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    // Use superjson for everything else (bigint, objects, etc.)
    return `"${superjson.stringify(value).replace(/"/g, '""')}"`;
  }

  async flushBatches(): Promise<void> {
    const batches = [
      { data: this.permissionsBatch, file: "permissions.csv" },
      { data: this.emissionsBatch, file: "emissions.csv" },
      { data: this.streamAllocationsBatch, file: "stream_allocations.csv" },
      { data: this.distributionTargetsBatch, file: "distribution_targets.csv" },
      { data: this.accumulatedStreamsBatch, file: "accumulated_streams.csv" },
    ];

    for (const batch of batches) {
      if (batch.data.length > 0) {
        const csvData =
          batch.data
            .map((row) =>
              Object.values(row as unknown as Record<string, unknown>)
                .map((val) => this.formatCsvValue(val))
                .join(","),
            )
            .join("\n") + "\n";

        await fs.appendFile(path.join(this.csvDir, batch.file), csvData);
      }
    }

    // Clear all batches
    this.permissionsBatch = [];
    this.emissionsBatch = [];
    this.streamAllocationsBatch = [];
    this.distributionTargetsBatch = [];
    this.accumulatedStreamsBatch = [];

    log.info("Flushed all batches to CSV files");
  }

  async run(): Promise<void> {
    await this.initialize();

    const currentBlock = await this.getCurrentBlock();
    const targetBlock = currentBlock - BLOCKS_TO_GO_BACK;

    log.info(`Current block: ${currentBlock}`);
    log.info(`Target block (${BLOCKS_TO_GO_BACK} blocks ago): ${targetBlock}`);
    log.info(`Block jump size: ${BLOCK_JUMP}`);

    // Load checkpoint or create new one
    let checkpoint = await this.loadCheckpoint();
    if (!checkpoint) {
      checkpoint = {
        currentBlock,
        targetBlock,
        processedBlocks: [],
      };
    }

    // Generate list of blocks to process
    const blocksToProcess: number[] = [];
    for (let block = currentBlock; block >= targetBlock; block -= BLOCK_JUMP) {
      if (!checkpoint.processedBlocks.includes(block)) {
        blocksToProcess.push(block);
      }
    }

    const totalIterations = Math.ceil(BLOCKS_TO_GO_BACK / BLOCK_JUMP);
    log.info(
      `Processing ${blocksToProcess.length} blocks (${totalIterations} total iterations)...`,
    );

    // Process blocks
    for (let i = 0; i < blocksToProcess.length; i++) {
      const block = blocksToProcess[i];
      if (block === undefined) {
        log.error(`Block at index ${i} is undefined, skipping`);
        continue;
      }
      const currentIteration = i + 1;

      try {
        await this.processBlock(block);
        checkpoint.processedBlocks.push(block);

        log.info(
          `Iteration ${currentIteration}/${totalIterations} - Block ${block}`,
        );

        // Save checkpoint every 50 blocks
        if (i % 50 === 0) {
          await this.saveCheckpoint(checkpoint);
          log.info(
            `Checkpoint saved at iteration ${currentIteration}/${totalIterations}`,
          );
        }
      } catch (error) {
        log.error(`Failed to process block ${block}:`, error);
        // Continue with next block
      }
    }

    // Flush any remaining batches
    await this.flushBatches();

    // Save final checkpoint
    await this.saveCheckpoint(checkpoint);

    log.info("Historical data fetching completed!");
    log.info(`CSV files saved to: ${this.csvDir}`);
    log.info("Generated CSV files:");
    log.info(
      "- permissions.csv: Base permission data for emission permissions",
    );
    log.info("- emissions.csv: Emission-specific permission data");
    log.info("- stream_allocations.csv: Stream allocation percentages");
    log.info(
      "- distribution_targets.csv: Distribution targets with accumulated tokens",
    );
    log.info(
      "- accumulated_streams.csv: Historical accumulated stream amounts",
    );

    await this.api.disconnect();
  }
}

// Main execution
async function main() {
  const fetcher = new HistoricalPermissionsFetcher();
  try {
    await fetcher.run();
  } catch (error) {
    log.error("Script failed:", error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
