"use client";

import { ApiPromise, WsProvider } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import type {
  AgentApplication,
  Api,
  CustomMetadataState,
  GrantEmissionPermission,
  UpdateEmissionPermission,
  Proposal,
} from "@torus-network/sdk";
import {
  grantEmissionPermission,
  sb_balance,
  updateEmissionPermission,
} from "@torus-network/sdk";
import { toNano } from "@torus-network/torus-utils/subspace";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { sendTransaction } from "./_components/send-transaction";
import type {
  AddAgentApplication,
  AddCustomProposal,
  AddDaoTreasuryTransferProposal,
  RegisterAgent,
  RemoveVote,
  Stake,
  Transfer,
  TransferStake,
  TransactionHelpers,
  UpdateAgent,
  UpdateDelegatingVotingPower,
  Vote,
} from "./_types";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

export type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

export type WithMetadataState<T> = T & { customData?: CustomMetadataState };

export type ApplicationState = WithMetadataState<AgentApplication>;
export type ProposalState = WithMetadataState<Proposal>;

export interface TorusApiState {
  web3Accounts: (() => Promise<InjectedAccountWithMeta[]>) | null;
  web3Enable: ((appName: string) => Promise<InjectedExtension[]>) | null;
  web3FromAddress: ((address: string) => Promise<InjectedExtension>) | null;
}

type TransactionExtrinsicPromise =
  | SubmittableExtrinsic<"promise", ISubmittableResult>
  | undefined;

interface TorusContextType {
  // TODO: Test changing `api` on `TorusProvider` to `ApiPromise` instead of `Api`
  api: Api | null;
  torusCacheUrl: string;

  setIsAccountConnected: (arg: boolean) => void;
  isInitialized: boolean;

  handleSelectWallet: (account: InjectedAccountWithMeta) => void;
  handleGetWallets: () => Promise<void>;
  handleLogout: () => void;

  isAccountConnected: boolean;
  accounts: InjectedAccountWithMeta[] | undefined;
  selectedAccount: InjectedAccountWithMeta | null;
  setSelectedAccount: (arg: InjectedAccountWithMeta | null) => void;
  estimateFee: (
    transaction: SubmittableExtrinsic<"promise", ISubmittableResult>,
  ) => Promise<bigint | null>;
  handleWalletModal: (state?: boolean) => void;
  openWalletModal: boolean;

  addStake: (stake: Stake) => Promise<void>;
  removeStake: (stake: Stake) => Promise<void>;
  transfer: (transfer: Transfer) => Promise<void>;
  transferStake: (transfer: TransferStake) => Promise<void>;

  voteProposal: (vote: Vote) => Promise<void>;
  removeVoteProposal: (removeVote: RemoveVote) => Promise<void>;

  registerAgent: (registerAgent: RegisterAgent) => Promise<void>;
  updateAgent: (updateAgent: UpdateAgent) => Promise<void>;
  addCustomProposal: (proposal: AddCustomProposal) => Promise<void>;
  AddAgentApplication: (application: AddAgentApplication) => Promise<void>;
  addDaoTreasuryTransferProposal: (
    proposal: AddDaoTreasuryTransferProposal,
  ) => Promise<void>;
  updateDelegatingVotingPower: (
    updateDelegating: UpdateDelegatingVotingPower,
  ) => Promise<void>;

  signHex: (msgHex: `0x${string}`) => Promise<{
    signature: `0x${string}`;
    address: string;
  }>;

  getExistentialDeposit: () => bigint | undefined;

  // TRANSACTIONS
  transferTransaction: ({
    to,
    amount,
  }: Omit<Transfer, "callback" | "refetchHandler">) =>
    | SubmittableExtrinsic<"promise", ISubmittableResult>
    | undefined;

  registerAgentTransaction: ({
    agentKey,
    name,
    url,
    metadata,
  }: Omit<
    RegisterAgent,
    "callback" | "refetchHandler"
  >) => TransactionExtrinsicPromise;

  addStakeTransaction: ({
    validator,
    amount,
  }: Omit<Stake, "callback" | "refetchHandler">) => TransactionExtrinsicPromise;

  removeStakeTransaction: ({
    validator,
    amount,
  }: Omit<Stake, "callback" | "refetchHandler">) => TransactionExtrinsicPromise;

  transferStakeTransaction: ({
    fromValidator,
    toValidator,
    amount,
  }: Omit<
    TransferStake,
    "callback" | "refetchHandler"
  >) => TransactionExtrinsicPromise;

  grantEmissionPermissionTransaction: (
    props: Omit<GrantEmissionPermission, "api"> & TransactionHelpers,
  ) => Promise<void>;

  updateEmissionPermissionTransaction: (
    props: Omit<UpdateEmissionPermission, "api"> & TransactionHelpers,
  ) => Promise<void>;
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
  const [openWalletModal, setOpenWalletModal] = useState(false);
  const [accounts, setAccounts] = useState<
    InjectedAccountWithMeta[] | undefined
  >([]);
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta | null>(null);

  const { toast } = useToast();

  // == Initialize Polkadot ==

  async function loadTorusApi(): Promise<void> {
    const { web3Accounts, web3Enable, web3FromAddress } = await import(
      "@polkadot/extension-dapp"
    );

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

  const handleWalletModal = (state?: boolean): void => {
    setOpenWalletModal(state ?? !openWalletModal);
  };

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

  // == Consts ==

  const getExistentialDeposit = () => {
    if (!api) return;
    return api.consts.balances.existentialDeposit.toBigInt();
  };

  // == Transactions ==

  const addStakeTransaction = ({
    validator,
    amount,
  }: Omit<Stake, "callback" | "refetchHandler">) => {
    if (!api?.tx.torus0?.addStake) return;
    return api.tx.torus0.addStake(validator, toNano(amount));
  };

  async function addStake({
    validator,
    amount,
    callback,
    refetchHandler,
  }: Stake): Promise<void> {
    if (!api?.tx.torus0?.addStake) return;

    const transaction = api.tx.torus0.addStake(validator, toNano(amount));
    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Staking",
      refetchHandler,
      wsEndpoint,
      toast,
    });
  }

  const removeStakeTransaction = ({
    validator,
    amount,
  }: Omit<Stake, "callback" | "refetchHandler">) => {
    if (!api?.tx.torus0?.removeStake) return;
    return api.tx.torus0.removeStake(validator, toNano(amount));
  };

  async function removeStake({
    validator,
    amount,
    callback,
    refetchHandler,
  }: Stake): Promise<void> {
    if (!api?.tx.torus0?.removeStake) return;

    const transaction = api.tx.torus0.removeStake(validator, toNano(amount));
    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Unstaking",
      refetchHandler,
      wsEndpoint,
      toast,
    });
  }

  const transferTransaction = ({
    to,
    amount,
  }: Omit<Transfer, "callback" | "refetchHandler">) => {
    if (!api?.tx.balances.transferAllowDeath) return;
    return api.tx.balances.transferAllowDeath(to, toNano(amount));
  };

  async function transfer({
    to,
    amount,
    callback,
    refetchHandler,
  }: Transfer): Promise<void> {
    const transaction = transferTransaction({ to, amount });

    if (!transaction) {
      console.log("Transaction not available");
      return;
    }
    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Transfer",
      refetchHandler,
      wsEndpoint,
      toast,
    });
  }

  const transferStakeTransaction = ({
    fromValidator,
    toValidator,
    amount,
  }: Omit<TransferStake, "callback" | "refetchHandler">) => {
    if (!api?.tx.torus0?.transferStake) return;

    return api.tx.torus0.transferStake(
      fromValidator,
      toValidator,
      toNano(amount),
    );
  };

  async function transferStake({
    fromValidator,
    toValidator,
    amount,
    callback,
    refetchHandler,
  }: TransferStake): Promise<void> {
    if (!api?.tx.torus0?.transferStake) return;

    const transaction = api.tx.torus0.transferStake(
      fromValidator,
      toValidator,
      toNano(amount),
    );
    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Transfer Stake",
      refetchHandler,
      wsEndpoint,
      toast,
    });
  }

  // == Subspace ==

  const registerAgentTransaction = ({
    agentKey,
    name,
    url,
    metadata,
  }: Omit<RegisterAgent, "callback" | "refetchHandler">) => {
    if (!api?.tx.torus0?.registerAgent) return;

    return api.tx.torus0.registerAgent(agentKey, name, url, metadata);
  };

  async function registerAgent({
    agentKey,
    name,
    url,
    metadata,
    callback,
  }: RegisterAgent): Promise<void> {
    if (!api?.tx.torus0?.registerAgent) return;

    const transaction = api.tx.torus0.registerAgent(
      agentKey,
      name,
      url,
      metadata,
    );

    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Register Agent",
      wsEndpoint,
      toast,
    });
  }

  async function updateAgent({
    name,
    url,
    metadata,
    callback,
  }: UpdateAgent): Promise<void> {
    if (!api?.tx.torus0?.updateAgent) return;

    const transaction = api.tx.torus0.updateAgent(
      name,
      url,
      metadata,
      undefined,
      undefined,
    );

    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Update Agent",
      wsEndpoint,
      toast,
    });
  }

  // == Governance ==

  async function voteProposal({
    proposalId,
    vote,
    callback,
    refetchHandler,
  }: Vote): Promise<void> {
    if (!api?.tx.governance?.voteProposal) return;

    const transaction = api.tx.governance.voteProposal(proposalId, vote);
    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Vote Proposal",
      wsEndpoint,
      refetchHandler,
      toast,
    });
  }

  async function removeVoteProposal({
    proposalId,
    callback,
    refetchHandler,
  }: RemoveVote): Promise<void> {
    if (!api?.tx.governance?.removeVoteProposal) return;

    const transaction = api.tx.governance.removeVoteProposal(proposalId);
    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Remove Vote",
      wsEndpoint,
      refetchHandler,
      toast,
    });
  }

  async function addCustomProposal({
    IpfsHash,
    callback,
  }: AddCustomProposal): Promise<void> {
    if (!api?.tx.governance?.addGlobalCustomProposal) return;

    const transaction = api.tx.governance.addGlobalCustomProposal(IpfsHash);
    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Create Custom Proposal",
      wsEndpoint,
      toast,
    });
  }

  async function AddAgentApplication({
    IpfsHash,
    applicationKey,
    removing,
    callback,
    refetchHandler,
  }: AddAgentApplication): Promise<void> {
    if (!api?.tx.governance?.submitApplication) return;

    const transaction = api.tx.governance.submitApplication(
      applicationKey,
      IpfsHash,
      removing,
    );
    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Create Dao Application",
      wsEndpoint,
      refetchHandler,
      toast,
    });
  }

  async function addDaoTreasuryTransferProposal({
    value,
    destinationKey,
    data,
    callback,
  }: AddDaoTreasuryTransferProposal): Promise<void> {
    if (!api?.tx.governance?.addDaoTreasuryTransferProposal) return;

    const transaction = api.tx.governance.addDaoTreasuryTransferProposal(
      toNano(value),
      destinationKey,
      data,
    );
    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Transfer Dao Treasury Proposal",
      wsEndpoint,
      toast,
    });
  }

  async function estimateFee(
    transaction: SubmittableExtrinsic<"promise", ISubmittableResult>,
  ) {
    // Check if the API is ready and has the transfer function
    if (!api?.isReady) {
      console.error("API is not ready");
      return null;
    }

    // Check if all required parameters are provided
    if (!selectedAccount) {
      console.error("Missing required parameters");
      return null;
    }

    // Estimate the fee using tryAsync
    const [error, info] = await tryAsync(
      transaction.paymentInfo(selectedAccount.address),
    );

    if (error !== undefined) {
      console.error(`Error estimating fee: ${error.message}`);
      return null;
    }

    // Parse the fee with the schema
    const [parseError, fee] = trySync(() => sb_balance.parse(info.partialFee));

    if (parseError !== undefined) {
      console.error(`Error parsing fee: ${parseError.message}`);
      return null;
    }

    return fee;
  }

  async function updateDelegatingVotingPower({
    isDelegating,
    callback,
    refetchHandler,
  }: UpdateDelegatingVotingPower): Promise<void> {
    if (
      !api?.tx.governance?.enableVoteDelegation ||
      !api.tx.governance.disableVoteDelegation
    )
      return;

    const transaction = isDelegating
      ? api.tx.governance.enableVoteDelegation()
      : api.tx.governance.disableVoteDelegation();

    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Update Delegating Voting Power",
      wsEndpoint,
      refetchHandler,
      toast,
    });
  }

  async function grantEmissionPermissionTransaction({
    grantee,
    allocation,
    targets,
    distribution,
    duration,
    revocation,
    enforcement,
    callback,
    refetchHandler,
  }: Omit<GrantEmissionPermission, "api"> & TransactionHelpers): Promise<void> {
    if (!api) {
      console.log("API not connected");
      return;
    }

    const transaction = grantEmissionPermission({
      api,
      grantee,
      allocation,
      targets,
      distribution,
      duration,
      revocation,
      enforcement,
    });

    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Grant Emission Permission",
      wsEndpoint,
      refetchHandler,
      toast,
    });
  }

  async function updateEmissionPermissionTransaction({
    permissionId,
    newTargets,
    newStreams,
    newDistributionControl,
    callback,
    refetchHandler,
  }: Omit<UpdateEmissionPermission, "api"> & TransactionHelpers): Promise<void> {
    if (!api) {
      console.log("API not connected");
      return;
    }

    const transaction = updateEmissionPermission({
      api,
      permissionId,
      newTargets,
      newStreams,
      newDistributionControl,
    });

    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Update Emission Permission",
      wsEndpoint,
      refetchHandler,
      toast,
    });
  }

  return (
    <TorusContext.Provider
      value={{
        accounts,
        AddAgentApplication,
        addCustomProposal,
        addDaoTreasuryTransferProposal,
        addStake,
        addStakeTransaction,
        api,
        estimateFee,
        getExistentialDeposit,
        handleGetWallets,
        handleLogout,
        handleSelectWallet,
        handleWalletModal,
        isAccountConnected,
        isInitialized,
        openWalletModal,
        registerAgent,
        registerAgentTransaction,
        updateAgent,
        removeStake,
        removeStakeTransaction,
        removeVoteProposal,
        selectedAccount,
        setIsAccountConnected,
        setSelectedAccount,
        signHex,
        torusCacheUrl,
        transfer,
        transferStake,
        transferStakeTransaction,
        transferTransaction,
        updateDelegatingVotingPower,
        voteProposal,
        grantEmissionPermissionTransaction,
        updateEmissionPermissionTransaction,
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
