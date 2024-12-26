"use client";

import type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import { createContext, useContext, useEffect, useState } from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";

import type {
  Api,
  CustomMetadataState,
  DaoApplications,
  Proposal,
} from "@torus-ts/subspace";
import { sb_balance } from "@torus-ts/subspace";
import { toNano } from "@torus-ts/utils/subspace";

import type {
  AddCustomProposal,
  AddDaoApplication,
  addTransferDaoTreasuryProposal,
  Bridge,
  RegisterAgent,
  RemoveVote,
  Stake,
  Transfer,
  TransferStake,
  UpdateDelegatingVotingPower,
  Vote,
} from "./_types";
import { sendTransaction } from "./_components/send-transaction";

export type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

export type WithMetadataState<T> = T & { customData?: CustomMetadataState };
export type DaoState = WithMetadataState<DaoApplications>;

export type ProposalState = WithMetadataState<Proposal>;

export interface TorusApiState {
  web3Accounts: (() => Promise<InjectedAccountWithMeta[]>) | null;
  web3Enable: ((appName: string) => Promise<InjectedExtension[]>) | null;
  web3FromAddress: ((address: string) => Promise<InjectedExtension>) | null;
}

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
    recipientAddress: string,
    amount: string,
  ) => Promise<bigint | null>;
  handleWalletModal: (state?: boolean) => void;
  openWalletModal: boolean;

  bridge: (bridge: Bridge) => Promise<void>;
  addStake: (stake: Stake) => Promise<void>;
  removeStake: (stake: Stake) => Promise<void>;
  transfer: (transfer: Transfer) => Promise<void>;
  transferStake: (transfer: TransferStake) => Promise<void>;

  voteProposal: (vote: Vote) => Promise<void>;
  removeVoteProposal: (removeVote: RemoveVote) => Promise<void>;

  RegisterAgent: (RegisterAgent: RegisterAgent) => Promise<void>;
  addCustomProposal: (proposal: AddCustomProposal) => Promise<void>;
  addDaoApplication: (application: AddDaoApplication) => Promise<void>;
  addTransferDaoTreasuryProposal: (
    proposal: addTransferDaoTreasuryProposal,
  ) => Promise<void>;
  updateDelegatingVotingPower: (
    updateDelegating: UpdateDelegatingVotingPower,
  ) => Promise<void>;

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
    await torusApi.web3Enable("torus Ai");

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

    setSelectedAccount(account);
    localStorage.removeItem("authorization");
    localStorage.setItem("favoriteWalletAddress", account.address);
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

  // == Transactions ==

  async function addStake({
    validator,
    amount,
    callback,
    refetchHandler,
  }: Stake): Promise<void> {
    if (!api?.tx.subspaceModule?.addStake) return;

    const transaction = api.tx.subspaceModule.addStake(
      validator,
      toNano(amount),
    );
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

  async function removeStake({
    validator,
    amount,
    callback,
    refetchHandler,
  }: Stake): Promise<void> {
    if (!api?.tx.subspaceModule?.removeStake) return;

    const transaction = api.tx.subspaceModule.removeStake(
      validator,
      toNano(amount),
    );
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

  async function transfer({
    to,
    amount,
    callback,
    refetchHandler,
  }: Transfer): Promise<void> {
    if (!api?.tx.balances.transferAllowDeath) return;
    const transaction = api.tx.balances.transferAllowDeath(to, toNano(amount));
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

  async function bridge({
    amount,
    callback,
    refetchHandler,
  }: Bridge): Promise<void> {
    if (!api?.tx.subspaceModule?.bridge) return;
    const transaction = api.tx.subspaceModule.bridge(toNano(amount));
    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Bridge",
      refetchHandler,
      wsEndpoint,
    });
  }

  async function transferStake({
    fromValidator,
    toValidator,
    amount,
    callback,
    refetchHandler,
  }: TransferStake): Promise<void> {
    if (!api?.tx.subspaceModule?.transferStake) return;

    const transaction = api.tx.subspaceModule.transferStake(
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

  async function RegisterAgent({
    subnetName,
    address,
    name,
    moduleId,
    metadata,
    callback,
  }: RegisterAgent): Promise<void> {
    if (!api?.tx.subspaceModule?.register) return;

    console.log(api.tx.subspaceModule);

    const transaction = api.tx.subspaceModule.register(
      subnetName,
      name,
      address,
      moduleId,
      metadata,
    );
    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Register Module",
      wsEndpoint,
    });
  }

  // == Governance ==

  async function voteProposal({
    proposalId,
    vote,
    callback,
  }: Vote): Promise<void> {
    if (!api?.tx.governanceModule?.voteProposal) return;

    const transaction = api.tx.governanceModule.voteProposal(proposalId, vote);
    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Vote Proposal",
      wsEndpoint,
    });
  }

  async function removeVoteProposal({
    proposalId,
    callback,
  }: RemoveVote): Promise<void> {
    if (!api?.tx.governanceModule?.removeVoteProposal) return;

    const transaction = api.tx.governanceModule.removeVoteProposal(proposalId);
    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Remove Vote",
      wsEndpoint,
    });
  }

  async function addCustomProposal({
    IpfsHash,
    callback,
  }: AddCustomProposal): Promise<void> {
    if (!api?.tx.governanceModule?.addGlobalCustomProposal) return;

    const transaction =
      api.tx.governanceModule.addGlobalCustomProposal(IpfsHash);
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

  async function addDaoApplication({
    IpfsHash,
    applicationKey,
    callback,
  }: AddDaoApplication): Promise<void> {
    if (!api?.tx.governanceModule?.addDaoApplication) return;

    const transaction = api.tx.governanceModule.addDaoApplication(
      applicationKey,
      IpfsHash,
    );
    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Create Dao Application",
      wsEndpoint,
    });
  }

  async function addTransferDaoTreasuryProposal({
    IpfsHash,
    value,
    dest,
    callback,
  }: addTransferDaoTreasuryProposal): Promise<void> {
    if (!api?.tx.governanceModule?.addTransferDaoTreasuryProposal) return;

    const transaction = api.tx.governanceModule.addTransferDaoTreasuryProposal(
      IpfsHash,
      toNano(value),
      dest,
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

  async function estimateFee(recipientAddress: string, amount: string) {
    try {
      // Check if the API is ready and has the transfer function
      if (!api?.isReady) {
        console.error("API is not ready");
        return null;
      }

      // Check if all required parameters are provided
      if (!amount || !selectedAccount) {
        console.error("Missing required parameters");
        return null;
      }

      // Create the transaction
      const transaction = api.tx.balances.transferKeepAlive(
        recipientAddress,
        amount,
      );

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
  }: UpdateDelegatingVotingPower): Promise<void> {
    if (
      !api?.tx.governanceModule?.enableVotePowerDelegation ||
      !api.tx.governanceModule.disableVotePowerDelegation
    )
      return;

    const transaction = isDelegating
      ? api.tx.governanceModule.enableVotePowerDelegation()
      : api.tx.governanceModule.disableVotePowerDelegation();

    await sendTransaction({
      api,
      torusApi,
      selectedAccount,
      callback,
      transaction,
      transactionType: "Update Delegating Voting Power",
      wsEndpoint,
    });
  }
  return (
    <TorusContext.Provider
      value={{
        api,
        torusCacheUrl,
        isAccountConnected,
        setIsAccountConnected,
        isInitialized,
        estimateFee,
        accounts,
        selectedAccount,
        setSelectedAccount,
        handleLogout,
        handleGetWallets,

        handleSelectWallet,
        handleWalletModal,
        openWalletModal,

        bridge,

        addStake,
        removeStake,
        transfer,
        transferStake,

        RegisterAgent,

        voteProposal,
        removeVoteProposal,
        addCustomProposal,
        addDaoApplication,
        addTransferDaoTreasuryProposal,

        updateDelegatingVotingPower,

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
