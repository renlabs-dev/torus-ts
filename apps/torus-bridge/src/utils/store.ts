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

const PERSIST_STATE_VERSION = 2;

// Default registry configuration to use as fallback
const DEFAULT_REGISTRY_URL =
  "https://raw.githubusercontent.com/hyperlane-xyz/hyperlane-registry";
const DEFAULT_REGISTRY_BRANCH = "main";

export interface AppState {
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
  transfers: TransferContext[];
  addTransfer: (t: TransferContext) => void;
  resetTransfers: () => void;
  updateTransferStatus: (
    i: number,
    s: TransferStatus,
    options?: { msgId?: string; originTxHash?: string },
  ) => void;
  failUnconfirmedTransfers: () => void;
  transferLoading: boolean;
  setTransferLoading: (isLoading: boolean) => void;
  isSideBarOpen: boolean;
  setIsSideBarOpen: (isOpen: boolean) => void;
  showEnvSelectModal: boolean;
  setShowEnvSelectModal: (show: boolean) => void;
  isInitialized: boolean;
  initializationError: string | null;
  setInitializationState: (
    isInitialized: boolean,
    error: string | null,
  ) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      chainMetadata: {},
      chainMetadataOverrides: {},
      setChainMetadataOverrides: (
        overrides: ChainMap<Partial<ChainMetadata> | undefined> = {},
      ) => {
        console.log("Setting chain metadata overrides:", overrides);
        try {
          // Instead of awaiting here, convert to promise chain
          initWarpContext(get().registry, overrides)
            .then(({ multiProvider }) => {
              const filtered = objFilter(
                overrides,
                (_, metadata) => !!metadata,
              );
              set({ chainMetadataOverrides: filtered, multiProvider });
            })
            .catch((error) => {
              console.error("Failed to set chain metadata overrides:", error);
              set({ initializationError: "Failed to update chain metadata" });
            });
        } catch (error) {
          console.error("Failed to set chain metadata overrides:", error);
          set({ initializationError: "Failed to update chain metadata" });
        }
      },
      multiProvider: new MultiProtocolProvider({}),
      registry: new GithubRegistry({
        uri: config.registryUrl ?? DEFAULT_REGISTRY_URL,
        branch: config.registryBranch ?? DEFAULT_REGISTRY_BRANCH,
        proxyUrl: config.registryProxyUrl,
      }),
      warpCore: new WarpCore(new MultiProtocolProvider({}), []),
      setWarpContext: ({
        registry,
        chainMetadata,
        multiProvider,
        warpCore,
      }) => {
        console.log(
          "Setting warp context with chainMetadata:",
          Object.keys(chainMetadata),
        );
        set({ registry, chainMetadata, multiProvider, warpCore });
      },
      transfers: [],
      addTransfer: (t) => {
        console.log("Adding transfer:", t);
        set((state) => ({ transfers: [...state.transfers, t] }));
      },
      resetTransfers: () => {
        console.log("Resetting transfers");
        set(() => ({ transfers: [] }));
      },
      updateTransferStatus: (i, s, options) => {
        console.log(
          "Updating transfer status at index:",
          i,
          "to:",
          s,
          "options:",
          options,
        );
        set((state) => {
          if (i >= state.transfers.length || i < 0) {
            console.error(
              "Invalid transfer index:",
              i,
              "transfers length:",
              state.transfers.length,
            );
            return state;
          }
          const txs = [...state.transfers];
          const currentTransfer = txs[i];

          // Ensure we're not creating properties that could be undefined
          if (currentTransfer) {
            txs[i] = {
              ...currentTransfer,
              status: s,
              msgId: options?.msgId ?? currentTransfer.msgId,
              originTxHash:
                options?.originTxHash ?? currentTransfer.originTxHash,
            };
          }
          return { transfers: txs };
        });
      },
      failUnconfirmedTransfers: () => {
        console.log("Failing unconfirmed transfers");
        set((state) => ({
          transfers: state.transfers.map((t) =>
            FinalTransferStatuses.includes(t.status)
              ? t
              : { ...t, status: TransferStatus.Failed },
          ),
        }));
      },
      transferLoading: false,
      setTransferLoading: (isLoading) => {
        console.log("Setting transfer loading:", isLoading);
        set(() => ({ transferLoading: isLoading }));
      },
      isSideBarOpen: false,
      setIsSideBarOpen: (isSideBarOpen) => {
        console.log("Setting sidebar open:", isSideBarOpen);
        set(() => ({ isSideBarOpen }));
      },
      showEnvSelectModal: false,
      setShowEnvSelectModal: (showEnvSelectModal) => {
        console.log("Setting env select modal:", showEnvSelectModal);
        set(() => ({ showEnvSelectModal }));
      },
      isInitialized: false,
      initializationError: null,
      setInitializationState: (isInitialized, error) => {
        console.log(
          "Setting initialization state:",
          isInitialized,
          "error:",
          error,
        );
        set(() => ({ isInitialized, initializationError: error }));
      },
    }),
    {
      name: "app-state",
      partialize: (state) => ({
        chainMetadataOverrides: state.chainMetadataOverrides,
        transfers: state.transfers,
      }),
      version: PERSIST_STATE_VERSION,
      onRehydrateStorage: () => {
        console.log("Rehydrating state");
        return (state, error) => {
          if (error || !state) {
            console.error("Error during hydration:", error);
            state?.setInitializationState(false, "State hydration failed");
            return;
          }
          state.failUnconfirmedTransfers();
          console.log("Initializing warp context during rehydration");
          initWarpContext(state.registry, state.chainMetadataOverrides)
            .then(({ registry, chainMetadata, multiProvider, warpCore }) => {
              state.setWarpContext({
                registry,
                chainMetadata,
                multiProvider,
                warpCore,
              });
              state.setInitializationState(true, null);
              console.log("Rehydration complete");
            })
            .catch((err) => {
              console.error("Rehydration failed:", err);
              state.setInitializationState(
                false,
                "Failed to initialize warp context",
              );
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
  const registryUrl = config.registryUrl ?? DEFAULT_REGISTRY_URL;
  const registryBranch = config.registryBranch ?? DEFAULT_REGISTRY_BRANCH;

  console.log(
    "Initializing warp context with registry URI:",
    registryUrl,
    "branch:",
    registryBranch,
  );

  try {
    // Make sure we have a registry URL and branch before proceeding
    if (!registryUrl || !registryBranch) {
      console.error("Invalid registry configuration:", {
        registryUrl,
        registryBranch,
      });
      throw new Error("Missing registry configuration");
    }

    console.log("Assembling warp core config");
    const coreConfig = assembleWarpCoreConfig();
    if (!coreConfig.tokens.length) {
      console.error("No tokens found in warp core config");
      throw new Error("Invalid warp core configuration");
    }

    const chainsInTokens = Array.from(
      new Set(coreConfig.tokens.map((t) => t.chainName)),
    );
    console.log("Chains in tokens:", chainsInTokens);

    console.log("Pre-loading registry content");
    await registry.listRegistryContent();

    console.log("Assembling chain metadata for chains:", chainsInTokens);
    const { chainMetadata, chainMetadataWithOverrides } =
      await assembleChainMetadata(
        chainsInTokens,
        registry,
        storeMetadataOverrides,
      );

    console.log(
      "Creating multi provider with chains:",
      Object.keys(chainMetadataWithOverrides),
    );
    const multiProvider = new MultiProtocolProvider(chainMetadataWithOverrides);

    console.log("Initializing WarpCore");
    const warpCore = WarpCore.FromConfig(multiProvider, coreConfig);

    return { registry, chainMetadata, multiProvider, warpCore };
  } catch (error) {
    console.error("Error initializing warp context:", error);
    logger.error("Error initializing warp context", error);
    return {
      registry,
      chainMetadata: {},
      multiProvider: new MultiProtocolProvider({}),
      warpCore: new WarpCore(new MultiProtocolProvider({}), []),
    };
  }
}
