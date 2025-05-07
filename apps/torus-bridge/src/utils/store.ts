import type { IRegistry } from "@hyperlane-xyz/registry";
import { GithubRegistry } from "@hyperlane-xyz/registry";
import type { ChainMap, ChainMetadata } from "@hyperlane-xyz/sdk";
import { MultiProtocolProvider, WarpCore } from "@hyperlane-xyz/sdk";
import { objFilter } from "@hyperlane-xyz/utils";
import { assembleChainMetadata } from "~/app/_components/chains/chain-metadata";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { assembleWarpCoreConfig } from "../app/_components/warp-core-config";
import { config } from "../consts/config";
import { logger } from "./logger";
import type { TransferContext } from "./types";
import { FinalTransferStatuses, TransferStatus } from "./types";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

// Increment this when persist state has breaking changes
const PERSIST_STATE_VERSION = 2;

// Keeping everything here for now as state is simple
// Will refactor into slices as necessary
export interface AppState {
  // Chains and providers
  chainMetadata: ChainMap<ChainMetadata>;
  chainMetadataOverrides: ChainMap<Partial<ChainMetadata>>;
  setChainMetadataOverrides: (
    overrides?: ChainMap<Partial<ChainMetadata> | undefined>,
  ) => void;
  multiProvider: MultiProtocolProvider;
  registry: IRegistry;
  warpCore: WarpCore;
  setWarpContext: (context: {
    registry: IRegistry;
    chainMetadata: ChainMap<ChainMetadata>;
    multiProvider: MultiProtocolProvider;
    warpCore: WarpCore;
  }) => void;

  // User history
  transfers: TransferContext[];
  addTransfer: (t: TransferContext) => void;
  resetTransfers: () => void;
  updateTransferStatus: (
    i: number,
    s: TransferStatus,
    options?: { msgId?: string; originTxHash?: string },
  ) => void;
  failUnconfirmedTransfers: () => void;

  // Shared component state
  transferLoading: boolean;
  setTransferLoading: (isLoading: boolean) => void;
  isSideBarOpen: boolean;
  setIsSideBarOpen: (isOpen: boolean) => void;
  showEnvSelectModal: boolean;
  setShowEnvSelectModal: (show: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    // Store reducers
    (set, get) => ({
      // Chains and providers
      chainMetadata: {},
      chainMetadataOverrides: {},
      setChainMetadataOverrides: (
        overrides: ChainMap<Partial<ChainMetadata> | undefined> = {},
      ) => {
        logger.debug("Setting chain overrides in store");
        const filtered = objFilter(overrides, (_, metadata) => !!metadata);
        set({ chainMetadataOverrides: filtered });
        
        // Initialize warp context in a non-blocking way
        void initWarpContext(
          get().registry,
          overrides,
        ).then(({ multiProvider }) => {
          set({ multiProvider });
        });
      },
      multiProvider: new MultiProtocolProvider({}),
      registry: new GithubRegistry({
        uri: config.registryUrl,
        branch: config.registryBranch,
        proxyUrl: config.registryProxyUrl,
      }),
      warpCore: new WarpCore(new MultiProtocolProvider({}), []),
      setWarpContext: ({
        registry,
        chainMetadata,
        multiProvider,
        warpCore,
      }) => {
        logger.debug("Setting warp context in store");
        set({ registry, chainMetadata, multiProvider, warpCore });
      },

      // User history
      transfers: [],
      addTransfer: (t) => {
        set((state) => ({ transfers: [...state.transfers, t] }));
      },
      resetTransfers: () => {
        set(() => ({ transfers: [] }));
      },
      updateTransferStatus: (i, s, options) => {
        set((state) => {
          if (i >= state.transfers.length) return state;
          const txs = [...state.transfers];
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          txs[i]!.status = s;
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          txs[i]!.msgId ??= options?.msgId;
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          txs[i]!.originTxHash ??= options?.originTxHash;
          return {
            transfers: txs,
          };
        });
      },
      failUnconfirmedTransfers: () => {
        set((state) => ({
          transfers: state.transfers.map((t) =>
            FinalTransferStatuses.includes(t.status)
              ? t
              : { ...t, status: TransferStatus.Failed },
          ),
        }));
      },

      // Shared component state
      transferLoading: false,
      setTransferLoading: (isLoading) => {
        set(() => ({ transferLoading: isLoading }));
      },
      isSideBarOpen: false,
      setIsSideBarOpen: (isSideBarOpen) => {
        set(() => ({ isSideBarOpen }));
      },
      showEnvSelectModal: false,
      setShowEnvSelectModal: (showEnvSelectModal) => {
        set(() => ({ showEnvSelectModal }));
      },
    }),

    // Store config
    {
      name: "app-state", // name in storage
      partialize: (state) => ({
        // fields to persist
        chainMetadataOverrides: state.chainMetadataOverrides,
        transfers: state.transfers,
      }),
      version: PERSIST_STATE_VERSION,
      onRehydrateStorage: () => {
        logger.debug("Rehydrating state");
        return (state, error) => {
          state?.failUnconfirmedTransfers();
          if (error || !state) {
            logger.error("Error during hydration: ", error);
            return;
          }
          void initWarpContext(
            state.registry,
            state.chainMetadataOverrides,
          ).then(({ registry, chainMetadata, multiProvider, warpCore }) => {
            state.setWarpContext({
              registry,
              chainMetadata,
              multiProvider,
              warpCore,
            });
            logger.debug("Rehydration complete");
          });
        };
      },
    },
  ),
);

async function initWarpContext(
  registry: IRegistry,
  storeMetadataOverrides: ChainMap<Partial<ChainMetadata> | undefined>,
) {
  // Step 1: Assemble warp core config
  const [configError, coreConfig] = trySync(() => assembleWarpCoreConfig());

  if (configError !== undefined) {
    logger.error("Error assembling warp core config:", configError);
    return {
      registry,
      chainMetadata: {},
      multiProvider: new MultiProtocolProvider({}),
      warpCore: new WarpCore(new MultiProtocolProvider({}), []),
    };
  }

  // Step 2: Get chains from tokens
  const [chainsError, chainsInTokens] = trySync(() =>
    Array.from(new Set(coreConfig.tokens.map((t) => t.chainName))),
  );

  if (chainsError !== undefined) {
    logger.error("Error extracting chains from tokens:", chainsError);
    return {
      registry,
      chainMetadata: {},
      multiProvider: new MultiProtocolProvider({}),
      warpCore: new WarpCore(new MultiProtocolProvider({}), []),
    };
  }

  // Step 3: Pre-load registry content
  const [registryError] = await tryAsync(
    Promise.resolve(registry.listRegistryContent()),
  );

  if (registryError !== undefined) {
    logger.error("Error loading registry content:", registryError);
    return {
      registry,
      chainMetadata: {},
      multiProvider: new MultiProtocolProvider({}),
      warpCore: new WarpCore(new MultiProtocolProvider({}), []),
    };
  }

  // Step 4: Assemble chain metadata
  const [metadataError, metadataSuccess] = await tryAsync(
    assembleChainMetadata(chainsInTokens, registry, storeMetadataOverrides),
  );

  if (metadataError !== undefined) {
    logger.error("Error assembling chain metadata:", metadataError);
    return {
      registry,
      chainMetadata: {},
      multiProvider: new MultiProtocolProvider({}),
      warpCore: new WarpCore(new MultiProtocolProvider({}), []),
    };
  }

  const { chainMetadata, chainMetadataWithOverrides } = metadataSuccess;

  // Step 5: Create multi provider
  const [providerError, multiProvider] = trySync(
    () => new MultiProtocolProvider(chainMetadataWithOverrides),
  );

  if (providerError !== undefined) {
    logger.error("Error creating multi provider:", providerError);
    return {
      registry,
      chainMetadata,
      multiProvider: new MultiProtocolProvider({}),
      warpCore: new WarpCore(new MultiProtocolProvider({}), []),
    };
  }

  // Step 6: Create warp core
  const [warpError, warpCore] = trySync(() =>
    WarpCore.FromConfig(multiProvider, coreConfig),
  );

  if (warpError !== undefined) {
    logger.error("Error creating warp core:", warpError);
    return {
      registry,
      chainMetadata,
      multiProvider,
      warpCore: new WarpCore(new MultiProtocolProvider({}), []),
    };
  }

  return { registry, chainMetadata, multiProvider, warpCore };
}
