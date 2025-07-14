import type { ApiPromise } from "@polkadot/api";
import type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import type { Enum } from "rustie";
import { match } from "rustie";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import type { TxStage } from "../transactions";

// TODO: finish implementing this refactor

export type WalletStatus = Enum<{
  Unavailable: null;
  PermissionRequest: null;
  Ready: { accounts: InjectedAccountWithMeta[] };
  Connected: { account: InjectedAccountWithMeta; injector: InjectedExtension };
  Error: { error: unknown };
}>;

interface WalletStatusHelper {
  isReady: boolean;
  isConnected: boolean;
  isError: boolean;
}

export type TxMap = Record<string, TxStage>;

// ==== Store ====

export interface WalletState {
  // Current wallet UI status
  status: WalletStatus;

  // all live txs keyed by hash
  txs: TxMap;

  // RFC‑78 root for current runtime
  metadataHash?: `0x${string}`;
  // Chain API
  api?: ApiPromise;
  // Websocket endpoint
  wsEndpoint?: string;

  // ---- Action ----

  // init: (args: { api: ApiPromise; wsEndpoint: string }) => void;
  // connectAccount: (
  //   acc: InjectedAccountWithMeta,
  //   web3FromAddress: (addr: string) => Promise<InjectedExtension>,
  // ) => Promise<void>;
  // submit: (tx: SubmittableExtrinsic<"promise">) => Promise<string>;
}

const _walletStatusToHelper = (status: WalletStatus): WalletStatusHelper => {
  const setOnHelper = <T extends Partial<WalletStatusHelper>>(
    opts: T,
  ): T & WalletStatusHelper => ({
    isReady: false,
    isConnected: false,
    isError: false,
    ...opts,
  });
  return match(status)<WalletStatusHelper>({
    Unavailable: () => setOnHelper({}),
    PermissionRequest: () => setOnHelper({}),
    Ready: () => setOnHelper({ isReady: true }),
    Connected: () => setOnHelper({ isReady: true, isConnected: true }), // ? Should both be set?
    Error: () => setOnHelper({ isError: true }),
  });
};

export const createWalletSlice = () =>
  create<WalletState>()(
    immer((_set) => ({
      status: { Unavailable: null },
      txs: {},
      isReady: false,
      isConnected: false,
      isError: false,
    })),
  );
