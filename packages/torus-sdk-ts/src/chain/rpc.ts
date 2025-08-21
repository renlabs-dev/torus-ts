import type { ApiPromise } from "@polkadot/api";
import type { Header } from "@polkadot/types/interfaces";
import type { IU8a } from "@polkadot/types/types";

import { strToByteArray } from "@torus-network/torus-utils";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

import type { Blocks, SS58Address } from "../types/index.js";
import { namespacePathParser, sb_blocks } from "../types/index.js";
import type { Api } from "./common/fees.js";

export interface LastBlock {
  blockHeader: Header;
  blockNumber: Blocks;
  blockHash: IU8a;
  blockHashHex: `${string}`;
  apiAtBlock: Api;
}

// TODO: queryLastBlock should return Result
export async function queryLastBlock(api: ApiPromise): Promise<LastBlock> {
  const [headerError, blockHeader] = await tryAsync(api.rpc.chain.getHeader());
  if (headerError !== undefined) {
    console.error("Error getting block header:", headerError);
    throw headerError;
  }

  const [apiError, apiAtBlock] = await tryAsync(api.at(blockHeader.hash));
  if (apiError !== undefined) {
    console.error("Error getting API at block:", apiError);
    throw apiError;
  }

  const [parseError, blockNumber] = trySync(() =>
    sb_blocks.parse(blockHeader.number),
  );
  if (parseError !== undefined) {
    console.error("Error parsing block number:", parseError);
    throw parseError;
  }

  const [hashError, blockHashHex] = trySync(() => blockHeader.hash.toHex());
  if (hashError !== undefined) {
    console.error("Error converting block hash to hex:", hashError);
    throw hashError;
  }

  const lastBlock = {
    blockHeader,
    blockNumber,
    blockHash: blockHeader.hash,
    blockHashHex,
    apiAtBlock,
  };

  return lastBlock;
}

/**
 * Queries the cost of creating a namespace path.
 *
 * This function calls the `torus0_namespacePathCreationCost` RPC method to
 * determine the fee and deposit required to create a namespace path for a given
 * account.
 *
 * **Note**: This RPC method is not automatically extracted by polkadot.js type
 * generation for unknown reasons, so it's implemented manually here.
 *
 * @param api - The Substrate API instance
 * @param accountId - The account that wants to create the namespace path
 * @param namespacePath - The namespace path to create (e.g. "agent.my-app.config")
 * @returns Result with fee and deposit amounts, or error if the operation fails
 *
 * @example
 * ```ts
 * const [error, costs] = await queryNamespacePathCreationCost(
 *   api,
 *   "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
 *   "agent.my-app.config"
 * );
 * if (error !== undefined) {
 *   console.error("Failed to get costs:", error);
 * } else {
 *   console.log(`Fee: ${costs.fee}, Deposit: ${costs.deposit}`);
 * }
 * ```
 */
export async function queryNamespacePathCreationCost(
  api: Api,
  accountId: SS58Address,
  namespacePath: string,
): Promise<Result<{ fee: bigint; deposit: bigint }, Error>> {
  // Validate the namespace path first
  const { data: path, error: pathError } =
    namespacePathParser().safeParse(namespacePath);
  if (pathError !== undefined) {
    return makeErr(new Error(`Invalid namespace path: ${pathError.message}`));
  }

  // Call the RPC method manually since it's not auto-generated
  // Note: Using provider send method because this RPC method is not auto-decorated

  // Convert the validated path string to bytes as expected by the substrate RPC
  const pathBytes = strToByteArray(path);

  const [rpcError, rpcResult] = await tryAsync(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
    (api as any)._rpcCore.provider.send("torus0_namespacePathCreationCost", [
      accountId,
      pathBytes,
    ]),
  );
  if (rpcError !== undefined) {
    return makeErr(new Error(`RPC call failed: ${rpcError.message}`));
  }

  // Parse the result as a tuple of (Balance, Balance)
  const [parseError, parsedResult] = trySync(() => {
    if (!Array.isArray(rpcResult) || rpcResult.length !== 2) {
      throw new Error(
        `Expected RPC result to be a tuple of two Balance values, got: ${JSON.stringify(rpcResult)}`,
      );
    }

    // TODO: sb_ Zod parser for tuple

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [feeRaw, depositRaw] = rpcResult;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const fee = BigInt(feeRaw);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const deposit = BigInt(depositRaw);

    return { fee, deposit };
  });

  if (parseError !== undefined) {
    return makeErr(
      new Error(`Failed to parse RPC result: ${parseError.message}`),
    );
  }

  return makeOk(parsedResult);
}
