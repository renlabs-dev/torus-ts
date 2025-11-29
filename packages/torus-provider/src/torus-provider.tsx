"use client";

import { ApiPromise, WsProvider } from "@polkadot/api";
import type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import type { AgentApplication, Api, Proposal } from "@torus-network/sdk/chain";
import type { CustomMetadataState } from "@torus-network/sdk/metadata";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
export type { TransactionResult } from "./_types";

export type WithMetadataState<T> = T & { customData?: CustomMetadataState };

export type ApplicationState = WithMetadataState<AgentApplication>;
export type ProposalState = WithMetadataState<Proposal>;

export interface TorusApiState {
  web3Accounts: (() => Promise<InjectedAccountWithMeta[]>) | null;
  web3Enable: ((appName: string) => Promise<InjectedExtension[]>) | null;
  web3FromAddress: ((address: string) => Promise<InjectedExtension>) | null;
}

interface TorusContextType {
  api: (Api & ApiPromise) | null;
  torusApi: TorusApiState; // TODO: refactor out
  wsEndpoint: string;
  torusCacheUrl: string;

  isInitialized: boolean;

  accounts: InjectedAccountWithMeta[] | undefined;
  selectedAccount: InjectedAccountWithMeta | null;
  isAccountConnected: boolean;

  handleLogout: () => void;
  handleSelectWallet: (account: InjectedAccountWithMeta) => void;
  handleGetWallets: () => Promise<void>;

  signHex: (msgHex: `0x${string}`) => Promise<{
    signature: `0x${string}`;
    address: string;
  }>;
}

const TorusContext = createContext<TorusContextType | null>(null);

interface TorusProviderProps {
  children: React.ReactNode;
  wsEndpoint: string;
  torusCacheUrl: string;
}

export function TorusProvider({
  children,
  wsEndpoint,
  torusCacheUrl,
}: Readonly<TorusProviderProps>) {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [torusApi, setTorusApi] = useState<TorusApiState>({
    web3Enable: null,
    web3Accounts: null,
    web3FromAddress: null,
  });
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isAccountConnected, setIsAccountConnected] = useState(false);
  const [accounts, setAccounts] = useState<
    InjectedAccountWithMeta[] | undefined
  >([]);
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta | null>(null);

  async function loadTorusApi(): Promise<void> {
    const { web3Accounts, web3Enable, web3FromAddress } =
      await import("@polkadot/extension-dapp");

    setTorusApi({
      web3Enable,
      web3Accounts,
      web3FromAddress,
    });
    const provider = new WsProvider(wsEndpoint);
    const newApi = await ApiPromise.create({ provider });
    setApi(newApi);
    setIsInitialized(true);
  }

  useEffect(() => {
    void loadTorusApi();

    return () => {
      void api?.disconnect();
    };
  }, [wsEndpoint]);

  async function getWallets(): Promise<InjectedAccountWithMeta[] | undefined> {
    if (!torusApi.web3Enable || !torusApi.web3Accounts || !api) return;

    const [enableError] = await tryAsync(torusApi.web3Enable("Torus Network"));

    if (enableError !== undefined) {
      console.error(`Failed to enable web3: ${enableError.message}`);
      return undefined;
    }

    const [accountsError, accounts] = await tryAsync(torusApi.web3Accounts());

    if (accountsError !== undefined) {
      console.error(`Failed to get web3 accounts: ${accountsError.message}`);
      return undefined;
    }

    const accountPromises = accounts.map(async (account) => {
      const [balanceError, balance] = await tryAsync(
        api.query.system.account(account.address),
      );

      if (balanceError !== undefined) {
        console.error(
          `Failed to get balance for ${account.address}: ${balanceError.message}`,
        );
        return {
          ...account,
          freeBalance: BigInt(0), // Default to zero balance on error
        };
      }

      return {
        ...account,
        freeBalance: balance.data.free.toBigInt(),
      };
    });

    const [accountsWithBalanceError, accountsWithBalance] = await tryAsync(
      Promise.all(accountPromises),
    );

    if (accountsWithBalanceError !== undefined) {
      console.error(
        `Failed to get account balances: ${accountsWithBalanceError.message}`,
      );
      return undefined;
    }

    const sortedAccounts = accountsWithBalance.sort((a, b) => {
      const balanceA = a.freeBalance;
      const balanceB = b.freeBalance;

      if (balanceA > balanceB) return -1; // a comes first (higher balance)
      if (balanceA < balanceB) return 1; // b comes first (higher balance)
      return 0;
    });

    return sortedAccounts;
  }

  async function handleGetWallets(): Promise<void> {
    const [error, allAccounts] = await tryAsync(getWallets());

    if (error !== undefined) {
      console.warn(`Failed to get wallets: ${error.message}`);
      return;
    }

    if (allAccounts) {
      setAccounts(allAccounts);
    }
  }

  const handleSelectWallet = (account: InjectedAccountWithMeta) => {
    const currentWallet = localStorage.getItem("favoriteWalletAddress");
    if (account.address === currentWallet) return;

    localStorage.removeItem("authorization");
    localStorage.setItem("favoriteWalletAddress", account.address);
    setSelectedAccount(account);
    setIsAccountConnected(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("authorization");
    localStorage.removeItem("favoriteWalletAddress");
    setSelectedAccount(null);
    setIsAccountConnected(false);
  };

  useEffect(() => {
    const favoriteWalletAddress = localStorage.getItem("favoriteWalletAddress");
    if (favoriteWalletAddress) {
      const fetchWallets = async () => {
        const walletList = await getWallets();
        if (!walletList) {
          console.warn("No wallet list found");
        }
        setAccounts(walletList);
        const accountExist = walletList?.find(
          (wallet) => wallet.address === favoriteWalletAddress,
        );
        if (accountExist) {
          setSelectedAccount(accountExist);
          setIsAccountConnected(true);
        }
      };
      fetchWallets().catch(console.error);
    }
  }, [isInitialized]);

  /**
   * Sings a message in hex format
   * @param msgHex message in hex to sign
   */
  async function signHex(
    msgHex: `0x${string}`,
  ): Promise<{ signature: `0x${string}`; address: string }> {
    if (!selectedAccount || !torusApi.web3FromAddress) {
      throw new Error("No selected account");
    }
    const injector = await torusApi.web3FromAddress(selectedAccount.address);

    if (!injector.signer.signRaw) {
      throw new Error("Signer does not support signRaw");
    }
    const result = await injector.signer.signRaw({
      address: selectedAccount.address,
      data: msgHex,
      type: "bytes",
    });

    return {
      signature: result.signature,
      address: selectedAccount.address,
    };
  }

  return (
    <TorusContext.Provider
      value={{
        api,
        torusApi,
        wsEndpoint,
        torusCacheUrl,

        isInitialized,

        accounts,
        selectedAccount,
        isAccountConnected,

        handleLogout,
        handleGetWallets,
        handleSelectWallet,

        signHex,
      }}
    >
      {children}
    </TorusContext.Provider>
  );
}

export const useTorus = (): TorusContextType => {
  const context = useContext(TorusContext);
  if (context === null) {
    throw new Error("useTorus must be used within a TorusProvider");
  }
  return context;
};
