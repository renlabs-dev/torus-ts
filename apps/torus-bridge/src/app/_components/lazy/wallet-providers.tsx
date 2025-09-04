"use client";

import dynamic from "next/dynamic";

// Lazy load heavy wallet providers
const EvmWalletProvider = dynamic(
  () =>
    import("../../../context/evm-wallet-provider").then((mod) => ({
      default: mod.EvmWalletProvider,
    })),
  {
    ssr: false,
    loading: () => <div>Loading EVM wallet...</div>,
  },
);

const SolanaWalletProvider = dynamic(
  () =>
    import("../../../context/solana-wallet-provider").then((mod) => ({
      default: mod.SolanaWalletProvider,
    })),
  {
    ssr: false,
    loading: () => <div>Loading Solana wallet...</div>,
  },
);

const StarknetWalletProvider = dynamic(
  () =>
    import("../../../context/starknet-wallet-provider").then((mod) => ({
      default: mod.StarknetWalletProvider,
    })),
  {
    ssr: false,
    loading: () => <div>Loading Starknet wallet...</div>,
  },
);

const CosmosWalletProvider = dynamic(
  () =>
    import("../../../context/cosmos-wallet-provider").then((mod) => ({
      default: mod.CosmosWalletProvider,
    })),
  {
    ssr: false,
    loading: () => <div>Loading Cosmos wallet...</div>,
  },
);

export {
  EvmWalletProvider,
  SolanaWalletProvider,
  StarknetWalletProvider,
  CosmosWalletProvider,
};
