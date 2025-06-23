/* eslint-disable */

import "@polkadot/api/augment";

import { ApiPromise, WsProvider } from "@polkadot/api";

import { checkSS58, SS58Address } from "./address.js";
import {
  generateRootStreamId,
  queryAccumulatedStreamsForAccount,
  queryDelegationStreamsByAccount,
  queryPermission,
  queryPermissions,
  queryPermissionsByGrantor,
  StreamId,
  buildAvailableStreamsFor,
} from "./modules/permission0.js";
import { sb_address, sb_bigint, sb_h256, sb_some } from "./types/index.js";

import { makeErr, makeOk } from "@torus-network/torus-utils/result";

import { BasicLogger } from "@torus-network/torus-utils/logger";
import { if_let } from "rustie";
import { assert } from "tsafe";

const log = BasicLogger.create({ name: "torus-sdk-ts.main" });

// // $ pnpm exec tsx src/main.ts

const NODE_URL = "wss://api.testnet.torus.network";

async function connectToChainRpc(wsEndpoint: string) {
  const wsProvider = new WsProvider(wsEndpoint);
  const api = await ApiPromise.create({ provider: wsProvider });
  if (!api.isConnected) {
    throw new Error("API not connected");
  }
  console.log("API connected");
  return api;
}

const api = await connectToChainRpc(NODE_URL);

// // ====

const [e0, permissions] = await queryPermissions(api);
if (e0 !== undefined) {
  console.error("queryPermissions failed:", e0);
  process.exit(1);
}

const testAddr = checkSS58("5DhzV3cXD984cZKcUZq3shTQFnwtTq4QPAwVGbSHBAvdAKJn");

const [permsByGrantorErr, permsByGrantor] = await queryPermissionsByGrantor(
  api,
  testAddr,
);

assert(
  permsByGrantorErr === undefined,
  "permsByGrantorErr should be undefined",
);

console.log(permsByGrantor);

// ----

// // Get all permissions
// const [e0, r0] = await queryPermissions(api);
// if (e0 !== undefined) {
//   console.error("Query failed:", r0);
//   process.exit(1);
// }
// // console.log("Permissions: ", r0);

// // r0.forEach((value, key) => {
// //   console.log("Key:", key);

// //   if (value.scope && value.scope.Emission) {
// //     const emission = value.scope.Emission;

// //     // Check if allocation has Streams
// //     if (emission.allocation && emission.allocation.Streams) {
// //       const streams = emission.allocation.Streams;

// //       console.log("Streams found:");
// //       streams.forEach((streamValue, streamKey) => {
// //         console.log(`  Stream ${streamKey}:`, streamValue);
// //       });
// //     } else {
// //         console.log("No stream found for this Key")
// //     }

// //     // Also log other emission details
// //     console.log("Distribution:", emission.distribution);
// //     console.log("Targets:", emission.targets);
// //     console.log("Accumulating:", emission.accumulating);
// //   }

// //   console.log("---");
// // });
// // const allStreams = new Map();

// // r0.forEach((value, key) => {
// //   if (value.scope && value.scope.Emission && value.scope.Emission.allocation && value.scope.Emission.allocation.Streams) {
// //     const streams = value.scope.Emission.allocation.Streams;

// //     // Add each stream to our collection with the parent key as context
// //     streams.forEach((streamValue, streamKey) => {
// //       allStreams.set(`${key}_${streamKey}`, {
// //         parentKey: key,
// //         streamKey: streamKey,
// //         streamData: streamValue
// //       });
// //     });
// //   }
// // });

// // console.log("All streams:", allStreams);

// // ====

// // const [e1, r1] = await queryPermissionsByGrantor(
// //   api,
// //   "5Dw5xxnpgVAbBgXtxT1DEWKv3YJJxHGELZKHNCEWzRNKbXdL",
// // );
// // if (e1 !== undefined) {
// //   console.error("Query failed:", e1);
// //   process.exit(1);
// // }

// // console.log("Permissions by grantor:", r1);
// // console.log();
// // console.log();

// // --

// const testAccount = checkSS58(
//   "5Guyw73fh7UvPXPtQ1bGqoTS8DRoZJHd2PTGwxS8PhHAN8HG",
// );
// // console.log("Testing with account:", testAccount);
// // console.log();

// // const result = await queryAccumulatedStreamsOf(api, testAccount);

// // const [error, streamsMap] = result;

// // const streamIds = new Set<StreamId>();

// // if (error !== undefined) {
// //   console.error("Query failed:", error);
// // } else {
// //   console.log(`Found accumulated streams for ${streamsMap.size} stream(s)`);

// //   for (const [streamId, permissionsMap] of streamsMap) {
// //     console.log(`\nStream ID: ${streamId}`);
// //     console.log(`  Permissions count: ${permissionsMap.size}`);

// //     for (const [permissionId, amount] of permissionsMap) {
// //       console.log(`  Permission ID: ${permissionId}`);
// //       console.log(`  Amount: ${amount.toString()}`);
// //     }

// //     streamIds.add(streamId);
// //     console.log();
// //   }
// // }

// // const rootStreamIdForAccount = generateRootStreamId(testAccount);

// // const allStreamIds = [rootStreamIdForAccount, ...streamIds];

// // console.log(`All stream IDs for account ${testAccount}:`, allStreamIds);

async function calculateStreams(
  api: ApiPromise,
  agentId: SS58Address,
): Promise<{
  received: bigint;
  distributed: bigint;
  delta: bigint;
} | null> {
  // Step 1: Get accumulated streams
  log.info("Querying accumulated streams for account");
  const [e1, accumulatedStreamData] = await queryAccumulatedStreamsForAccount(
    api,
    agentId,
  );
  if (e1 !== undefined) {
    return null;
  }
  log.info("Query successful");
  console.log("-----");
  log.info("Calculating total received");
  let totalReceived = 0n;
  const streamTotalsMap = new Map<StreamId, bigint>();

  accumulatedStreamData.forEach((permissionMap, streamId) => {
    let streamTotal = 0n;
    permissionMap.forEach((balance) => {
      totalReceived += balance;
      streamTotal += balance;
    });
    streamTotalsMap.set(streamId, streamTotal);
  });

  log.info("Querying delegated permissions");

  // Step 2: Get delegated permissions and calculate distributed
  const [e2, delegatedPermissionIds] = await queryPermissionsByGrantor(
    api,
    agentId,
  );
  if (e2 !== undefined) {
    return null;
  }
  if (delegatedPermissionIds === null) {
    console.log("No delegated permissions found");
    return null;
  }

  let totalDistributed = 0n;

  for (const permissionId of delegatedPermissionIds) {
    const [e3, permission] = await queryPermission(api, permissionId);
    if (e3 !== undefined) continue;

    if (!permission) continue;

    const streams = if_let(permission.scope, "Emission")(
      (emissionScope) =>
        if_let(emissionScope.allocation, "Streams")(
          (streams) => streams,
          () => null,
        ),
      () => null,
    );
    // Skip if permission doesn't have Streams allocation
    if (streams === null) continue;

    streams.forEach((percentage, streamId) => {
      const streamTotal = streamTotalsMap.get(streamId) ?? 0n;
      const distributedForStream = (streamTotal * BigInt(percentage)) / 100n;
      totalDistributed += distributedForStream;
    });
  }

  const deltaStreams = totalReceived - totalDistributed;
  log.info("Streams calculated");

  return {
    received: totalReceived,
    distributed: totalDistributed,
    delta: deltaStreams,
  };
}

async function calculateStreamsForAllAgents(api: ApiPromise): Promise<
  Map<
    string,
    {
      received: bigint;
      distributed: bigint;
      delta: bigint;
    }
  >
> {
  log.info("Querying permissions...");
  const [queryError, permissionsMap] = await queryPermissions(api);
  if (queryError !== undefined) {
    log.error("Query failed:", queryError);
    return new Map();
  }

  log.info("Calculating stream metrics for all agents...");

  // Step 1: Extract all unique agents (grantors and grantees) from permissions
  const allAgents = new Set<SS58Address>();
  permissionsMap.forEach((permission) => {
    allAgents.add(permission.grantor);
    allAgents.add(permission.grantee);
  });

  log.info(`Found ${allAgents.size} unique agents to process`);

  const results = new Map<
    string,
    {
      received: bigint;
      distributed: bigint;
      delta: bigint;
    }
  >();

  // Step 2: Process each agent
  let processedCount = 0;
  for (const agentId of allAgents) {
    processedCount++;
    log.info(
      `Processing agent ${processedCount}/${allAgents.size}: ${agentId}`,
    );

    const metrics = await calculateStreams(api, agentId);
    if (metrics) {
      results.set(agentId, metrics);

      // Log non-zero results
      if (metrics.received > 0n || metrics.distributed > 0n) {
        log.info(`Agent ${agentId} has activity.`);
      }
    }
  }

  log.info("Finished processing all agents");
  return results;
}

// log.info("Calculating streams for all agents...");
// await calculateStreamsForAllAgents(api);

// -----------------------------------------------------------------------------

// TODO: for a given grantor, list the streams that it can give, i.e.
// - It's root stream, calculated from it's address
// - They other streams that are reaching it
// These two must be differentiated somehow.

// List all accumulated streams
const allAccumulatedStreams =
  await api.query.permission0.accumulatedStreamAmounts.entries();
for (const [keys, valueRaw] of allAccumulatedStreams) {
  const [agentIdRaw, permIdRaw, streamIdRaw] = keys.args;
  const agentId = sb_address.parse(agentIdRaw);
  const permId = sb_h256.parse(permIdRaw);
  const streamId = sb_h256.parse(streamIdRaw);
  const balance = sb_some(sb_bigint).parse(valueRaw);
  console.log("Stream:", agentId, permId, streamId, balance);
  console.log();
}

console.log();
console.log();

/**
 * Instantaneous stream amounts for an agent.
 */
async function getAllAvailableStreamsFor(agentId: SS58Address) {
  const agentRootStreamId = generateRootStreamId(agentId);

  const [qErr, baseStreamsMap] = await queryAccumulatedStreamsForAccount(
    api,
    agentId,
  );
  if (qErr !== undefined) return makeErr(qErr);

  const streamsTotalMap = new Map<StreamId, bigint>();
  for (const [streamId, permToAmountMap] of baseStreamsMap) {
    for (const [_permId, amount] of permToAmountMap) {
      const cur = streamsTotalMap.get(streamId) ?? 0n;
      streamsTotalMap.set(streamId, cur + amount);
    }
  }

  return makeOk({
    agentRootStreamId,
    streamsMap: streamsTotalMap,
  });
}

function handleStreamsMap(
  streamsMap: Map<StreamId, bigint>,
  agentRootStreamId: StreamId,
) {
  const sortedStreams = Array.from(streamsMap.entries()).sort((a, b) =>
    Number(a[1] - b[1]),
  );

  // Check if one of the streams is the agent's root stream
  const selfStream = sortedStreams.filter(
    ([streamId]) => streamId === agentRootStreamId,
  );
  const hasSelfStream = selfStream.length > 0;

  // If not, add it to the end
  const streams = !hasSelfStream
    ? [...sortedStreams, [agentRootStreamId, 0n]]
    : sortedStreams;

  return streams.map(
    ([streamId, amount]) =>
      `<StreamComponent streamId={${streamId}} amount={${amount}} isRoot={${streamId === agentRootStreamId}} />`,
  );
}

//

const streamTestAccount = checkSS58(
  // "5F9esPAgeRtfdapYJSPyvSMJkXvZNuRnxJBsCa6JDhjw68FX", // Honza fake multiple-streams receiving account
  "5GzbJksCeLt7Xs1ju1kCLBsyKW3r7cP7ZCb2R5GdUx3UKayr",
);

const [accStErr, accumulatedStreams] = await queryAccumulatedStreamsForAccount(
  api,
  streamTestAccount,
);
if (accStErr !== undefined) console.log(accStErr), process.exit(1);

const pickedStreams = buildAvailableStreamsFor(streamTestAccount, {
  permissions,
  accumulatedStreams,
});

const renderList = handleStreamsMap(
  pickedStreams.streamsMap,
  pickedStreams.agentRootStreamId,
);
console.log(renderList);

/**
 * Example function demonstrating how to query delegation streams for an account
 */
async function showDelegationStreamsExample(
  api: ApiPromise,
  accountId: SS58Address,
): Promise<void> {
  console.log("\n=== DELEGATION STREAMS EXAMPLE ===\n");
  console.log(`Querying delegation streams for account: ${accountId}`);

  const [err, delegationStreams] = await queryDelegationStreamsByAccount(
    api,
    accountId,
  );
  if (err !== undefined) {
    console.log("Error querying delegation streams:", err);
    return;
  }

  console.log(`Found ${delegationStreams.size} delegation stream(s):`);

  if (delegationStreams.size === 0) {
    console.log("  No delegation streams found for this account.");
  } else {
    for (const [permissionId, delegation] of delegationStreams) {
      console.log(`\n  Permission ID: ${permissionId}`);
      console.log(`    Delegating to: ${delegation.grantee}`);
      console.log(`    Stream ID: ${delegation.streamId}`);
      console.log(`    Percentage: ${delegation.percentage}%`);
      console.log(`    Accumulated Amount: ${delegation.accumulatedAmount}`);
      console.log(`    Target Count: ${delegation.targets.size}`);

      if (delegation.targets.size > 0) {
        console.log("    Targets:");
        for (const [targetAddress, targetAmount] of delegation.targets) {
          console.log(`      ${targetAddress}: ${targetAmount.toString()}`);
        }
      }
    }
  }

  console.log("\n=== END DELEGATION STREAMS EXAMPLE ===\n");
}

// ---- Run delegation streams example ----

await showDelegationStreamsExample(
  api,
  // checkSS58("5Guyw73fh7UvPXPtQ1bGqoTS8DRoZJHd2PTGwxS8PhHAN8HG"),
  checkSS58("5Guyw73fh7UvPXPtQ1bGqoTS8DRoZJHd2PTGwxS8PhHAN8HG"),
);

// ----

await api.disconnect();

process.exit(0);
