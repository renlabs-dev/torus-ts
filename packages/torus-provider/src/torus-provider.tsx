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
  Proposal,
} from "@torus-ts/subspace";
import { sb_balance } from "@torus-ts/subspace";
import { toNano } from "@torus-ts/utils/subspace";
import { createContext, useContext, useEffect, useState } from "react";

import { sendTransaction } from "./_components/send-transaction";
import type {
  AddAgentApplication,
  AddCustomProposal,
  addDaoTreasuryTransferProposal,
  registerAgent,
  RemoveVote,
  Stake,
  Transfer,
  TransferStake,
  UpdateDelegatingVotingPower,
  Vote,
} from "./_types";

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

  registerAgent: (registerAgent: registerAgent) => Promise<void>;
  addCustomProposal: (proposal: AddCustomProposal) => Promise<void>;
  AddAgentApplication: (application: AddAgentApplication) => Promise<void>;
  addDaoTreasuryTransferProposal: (
    proposal: addDaoTreasuryTransferProposal,
  ) => Promise<void>;
  updateDelegatingVotingPower: (
    updateDelegating: UpdateDelegatingVotingPower,
  ) => Promise<void>;

  signHex: (msgHex: `0x${string}`) => Promise<{
    signature: `0x${string}`;
    address: string;
  }>;

  getExistencialDeposit: () => bigint | undefined;

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
    registerAgent,
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
}: TorusProviderProps): JSX.Element {
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
    if (!torusApi.web3Enable || !torusApi.web3Accounts) return;
    await torusApi.web3Enable("Torus Network");

    try {
      const response = await torusApi.web3Accounts();
      return response;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return undefined;
    }
  }

  async function handleGetWallets(): Promise<void> {
    try {
      const allAccounts = await getWallets();
      if (allAccounts) {
        setAccounts(allAccounts);
      }
    } catch (error) {
      console.warn(error);
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

  const getExistencialDeposit = () => {
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
    });
  }

  // == Subspace ==

  const registerAgentTransaction = ({
    agentKey,
    name,
    url,
    metadata,
  }: Omit<registerAgent, "callback" | "refetchHandler">) => {
    if (!api?.tx.torus0?.registerAgent) return;

    return api.tx.torus0.registerAgent(agentKey, name, url, metadata);
  };

  async function registerAgent({
    agentKey,
    name,
    url,
    metadata,
    callback,
  }: registerAgent): Promise<void> {
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
    });
  }

  async function addDaoTreasuryTransferProposal({
    value,
    destinationKey,
    data,
    callback,
  }: addDaoTreasuryTransferProposal): Promise<void> {
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
    });
  }

  async function estimateFee(
    transaction: SubmittableExtrinsic<"promise", ISubmittableResult>,
  ) {
    try {
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

      // Estimate the fee
      const info = await transaction.paymentInfo(selectedAccount.address);

      return sb_balance.parse(info.partialFee);
    } catch (error) {
      console.error("Error estimating fee:", error);
      return null;
    }
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
        getExistencialDeposit,
        handleGetWallets,
        handleLogout,
        handleSelectWallet,
        handleWalletModal,
        isAccountConnected,
        isInitialized,
        openWalletModal,
        registerAgent,
        registerAgentTransaction,
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
