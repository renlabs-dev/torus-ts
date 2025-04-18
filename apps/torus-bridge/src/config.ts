export interface ChainValues {
  name: string;
  displayName: string;
  chainId: number;
}

export type ChainEnv = "mainnet" | "testnet";

export const evmChainValues = {
  torus: {
    mainnet: {
      name: "torus",
      displayName: "Torus",
      chainId: 21000,
    },
    testnet: {
      name: "torustestnet",
      displayName: "Torus Testnet EVM",
      chainId: 21001,
    },
  },
  base: {
    mainnet: {
      name: "base",
      displayName: "Base",
      chainId: 8453,
    },
    testnet: {
      name: "base",
      displayName: "Base",
      chainId: 84532,
    },
  },
} satisfies Record<string, Record<ChainEnv, ChainValues>>;

/**
 * Returns a function that retrieves chain values for a given environment.
 *
 * @param env - The environment for which to retrieve chain values.
 * @returns A function that takes a chain name and returns the corresponding chain values for the specified environment.
 *
 * @throws Will throw an error if there are no chain values for the specified chain name.
 */
export const getChainValuesOnEnv =
  (env: ChainEnv) =>
  <Name extends keyof typeof evmChainValues>(chainName: Name) => {
    const chainVals = evmChainValues[chainName];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (chainVals == null) throw new Error(`No chain values for ${chainName}`);
    return chainVals[env];
  };
