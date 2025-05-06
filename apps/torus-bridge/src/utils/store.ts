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
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      chainMetadata: {},
      chainMetadataOverrides: {},
      setChainMetadataOverrides: async (
        overrides: ChainMap<Partial<ChainMetadata> | undefined> = {},
      ) => {
        console.log("Setting chain metadata overrides:", overrides);
        try {
          console.log("Initializing warp context for overrides");
          const { multiProvider } = await initWarpContext(
            get().registry,
            overrides,
          );
          console.log("Filtering overrides");
          const filtered = objFilter(overrides, (_, metadata) => !!metadata);
          console.log(
            "Updating state with filtered overrides and multiProvider",
          );
          set({ chainMetadataOverrides: filtered, multiProvider });
        } catch (error) {
          console.error("Error setting chain metadata overrides:", error);
        }
      },
      multiProvider: new MultiProtocolProvider({}),
      registry: (() => {
        console.log("Creating GithubRegistry with config:", {
          uri: config.registryUrl,
          branch: config.registryBranch,
          proxyUrl: config.registryProxyUrl,
        });
        try {
          return new GithubRegistry({
            uri: config.registryUrl,
            branch: config.registryBranch,
            proxyUrl: config.registryProxyUrl,
          });
        } catch (error) {
          console.error("Error creating GithubRegistry:", error);
          return new GithubRegistry({ uri: "", branch: "" });
        }
      })(),
      warpCore: (() => {
        console.log("Creating initial WarpCore");
        try {
          return new WarpCore(new MultiProtocolProvider({}), []);
        } catch (error) {
          console.error("Error creating initial WarpCore:", error);
          return new WarpCore(new MultiProtocolProvider({}), []);
        }
      })(),
      setWarpContext: ({
        registry,
        chainMetadata,
        multiProvider,
        warpCore,
      }) => {
        console.log(
          "Setting warp context with chainMetadata keys:",
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
          txs[i] = {
            ...txs[i],
            status: s,
            msgId: options?.msgId ?? txs[i].msgId,
            originTxHash: options?.originTxHash ?? txs[i]?.originTxHash,
          };
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
            return;
          }
          console.log("Failing unconfirmed transfers during rehydration");
          state.failUnconfirmedTransfers();
          console.log("Initializing warp context for rehydration");
          initWarpContext(state.registry, state.chainMetadataOverrides)
            .then(({ registry, chainMetadata, multiProvider, warpCore }) => {
              console.log("Rehydration successful, setting warp context");
              state.setWarpContext({
                registry,
                chainMetadata,
                multiProvider,
                warpCore,
              });
            })
            .catch((error) => {
              console.error(
                "Error during rehydration warp context initialization:",
                error,
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
  console.log(
    "Starting initWarpContext with registry URI:",
    config.registryUrl,
  );
  try {
    console.log("Assembling warp core config");
    const coreConfig = assembleWarpCoreConfig();
    console.log(
      "Warp core config assembled, tokens:",
      coreConfig.tokens?.length,
    );

    console.log("Extracting unique chain names from tokens");
    const chainsInTokens = Array.from(
      new Set(coreConfig.tokens.map((t) => t.chainName)),
    );
    console.log("Chains in tokens:", chainsInTokens);

    console.log("Pre-loading registry content");
    try {
      await registry.listRegistryContent();
      console.log("Registry content loaded successfully");
    } catch (error) {
      console.error("Error loading registry content:", error);
      throw error;
    }

    console.log("Assembling chain metadata for chains:", chainsInTokens);
    try {
      const { chainMetadata, chainMetadataWithOverrides } =
        await assembleChainMetadata(
          chainsInTokens,
          registry,
          storeMetadataOverrides,
        );
      console.log(
        "Chain metadata assembled, chains:",
        Object.keys(chainMetadata),
      );

      console.log("Creating MultiProtocolProvider");
      const multiProvider = new MultiProtocolProvider(
        chainMetadataWithOverrides,
      );
      console.log("MultiProtocolProvider created");

      console.log("Creating WarpCore from config");
      const warpCore = WarpCore.FromConfig(multiProvider, coreConfig);
      console.log("WarpCore created successfully");

      return { registry, chainMetadata, multiProvider, warpCore };
    } catch (error) {
      console.error("Error assembling chain metadata:", error);
      throw error;
    }
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
