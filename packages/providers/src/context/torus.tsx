"use client";

import type { SubmittableResult } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { Balance, DispatchError } from "@polkadot/types/interfaces";
import { createContext, useContext, useEffect, useState } from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { toast } from "react-toastify";

import type {
  AddCustomProposal,
  AddDaoApplication,
  addTransferDaoTreasuryProposal,
  BaseDao,
  BaseProposal,
  DaoState,
  InjectedAccountWithMeta,
  InjectedExtension,
  LastBlock,
  ProposalState,
  RegisterModule,
  RemoveVote,
  SS58Address,
  Stake,
  StakeOutData,
  TransactionResult,
  Transfer,
  TransferStake,
  UpdateDelegatingVotingPower,
  Vote,
} from "../types";
import {
  useAllStakeOut,
  useBalance,
  useCustomMetadata,
  useDaos,
  useDaoTreasury,
  useLastBlock,
  useNotDelegatingVoting,
  useProposals,
  useRewardAllocation,
  useUnrewardedProposals,
  useUserTotalStaked,
} from "../hooks";
import { calculateAmount } from "../utils";

interface torusApiState {
  web3Accounts: (() => Promise<InjectedAccountWithMeta[]>) | null;
  web3Enable: ((appName: string) => Promise<InjectedExtension[]>) | null;
  web3FromAddress: ((address: string) => Promise<InjectedExtension>) | null;
}

interface TorusContextType {
  api: ApiPromise | null;
  torusCacheUrl: string;

  isConnected: boolean;
  setIsConnected: (arg: boolean) => void;
  isInitialized: boolean;

  handleGetWallets: () => void;
  handleConnect: () => Promise<void>;
  accounts: InjectedAccountWithMeta[] | undefined;
  selectedAccount: InjectedAccountWithMeta | null;
  setSelectedAccount: (arg: InjectedAccountWithMeta | null) => void;
  estimateFee: (
    recipientAddress: string,
    amount: string,
  ) => Promise<Balance | null>;
  handleWalletModal: (state?: boolean) => void;
  openWalletModal: boolean;

  addStake: (stake: Stake) => Promise<void>;
  removeStake: (stake: Stake) => Promise<void>;
  transfer: (transfer: Transfer) => Promise<void>;
  transferStake: (transfer: TransferStake) => Promise<void>;
  voteProposal: (vote: Vote) => Promise<void>;
  removeVoteProposal: (removeVote: RemoveVote) => Promise<void>;

  registerModule: (registerModule: RegisterModule) => Promise<void>;
  addCustomProposal: (proposal: AddCustomProposal) => Promise<void>;
  addDaoApplication: (application: AddDaoApplication) => Promise<void>;
  addTransferDaoTreasuryProposal: (
    proposal: addTransferDaoTreasuryProposal,
  ) => Promise<void>;

  updateDelegatingVotingPower: (
    updateDelegating: UpdateDelegatingVotingPower,
  ) => Promise<void>;

  lastBlock: LastBlock | undefined;
  isLastBlockLoading: boolean;

  balance: bigint | undefined;
  isBalanceLoading: boolean;

  daoTreasury: SS58Address | undefined;
  isDaoTreasuryLoading: boolean;

  notDelegatingVoting: string[] | undefined;
  isNotDelegatingVotingLoading: boolean;

  unrewardedProposals: number[] | undefined;
  isUnrewardedProposalsLoading: boolean;

  rewardAllocation: bigint | null | undefined;
  isRewardAllocationLoading: boolean;

  stakeOut: StakeOutData | undefined;
  isStakeOutLoading: boolean;

  userTotalStaked: { address: string; stake: string }[] | undefined;
  isUserTotalStakedLoading: boolean;

  proposalsWithMeta: ProposalState[] | undefined;
  isProposalsLoading: boolean;

  daosWithMeta: DaoState[] | undefined;
  isDaosLoading: boolean;

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
  const [torusApi, settorusApi] = useState<torusApiState>({
    web3Enable: null,
    web3Accounts: null,
    web3FromAddress: null,
  });
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState(false);
  const [openWalletModal, setOpenWalletModal] = useState(false);
  const [accounts, setAccounts] = useState<
    InjectedAccountWithMeta[] | undefined
  >([]);
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta | null>(null);

  // == Initialize Polkadot ==

  async function loadtorusApi(): Promise<void> {
    const { web3Accounts, web3Enable, web3FromAddress } = await import(
      "@polkadot/extension-dapp"
    );
    settorusApi({
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
    void loadtorusApi();

    return () => {
      void api?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsEndpoint]);

  async function getWallets(): Promise<InjectedAccountWithMeta[] | undefined> {
    if (!torusApi.web3Enable || !torusApi.web3Accounts) return;
    const extensions = await torusApi.web3Enable("torus Ai");
    if (!extensions) {
      toast.error("No account selected");
    }
    try {
      const response = await torusApi.web3Accounts();
      return response;
    } catch (error) {
      return undefined;
    }
  }

  async function handleConnect() {
    try {
      const allAccounts = await getWallets();
      if (allAccounts) {
        setAccounts(allAccounts);
      }
    } catch (error) {
      console.warn(error);
    }
  }

  useEffect(() => {
    const favoriteWalletAddress = localStorage.getItem("favoriteWalletAddress");
    if (favoriteWalletAddress) {
      const fetchWallets = async () => {
        const walletList = await getWallets();
        const accountExist = walletList?.find(
          (wallet) => wallet.address === favoriteWalletAddress,
        );
        if (accountExist) {
          setSelectedAccount(accountExist);
          setIsConnected(true);
        }
      };
      fetchWallets().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  async function handleGetWallets(): Promise<void> {
    try {
      const allAccounts = await getWallets();
      if (allAccounts) {
        setAccounts(allAccounts);
      }
    } catch (error) {
      return undefined;
    }
  }

  const handleWalletModal = (state?: boolean): void => {
    setOpenWalletModal(state || !openWalletModal);
  };

  // == Transaction Handler ==

  async function sendTransaction(
    transactionType: string,
    transaction: SubmittableExtrinsic<"promise">,
    callback?: (result: TransactionResult) => void,
  ): Promise<void> {
    if (!api || !selectedAccount || !torusApi.web3FromAddress) return;
    try {
      const injector = await torusApi.web3FromAddress(selectedAccount.address);
      await transaction.signAndSend(
        selectedAccount.address,
        { signer: injector.signer },
        (result: SubmittableResult) => {
          if (result.status.isInBlock) {
            callback?.({
              finalized: false,
              status: "PENDING",
              message: `${transactionType} in progress`,
            });
          }
          if (result.status.isFinalized) {
            const success = result.findRecord("system", "ExtrinsicSuccess");
            const failed = result.findRecord("system", "ExtrinsicFailed");

            if (success) {
              toast.success(`${transactionType} successful`);
              callback?.({
                finalized: true,
                status: "SUCCESS",
                message: `${transactionType} successful, reload in 2 seconds`,
              });
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else if (failed) {
              const [dispatchError] = failed.event.data as unknown as [
                DispatchError,
              ];
              let msg = `${transactionType} failed: ${dispatchError.toString()}`;

              if (dispatchError.isModule) {
                const mod = dispatchError.asModule;
                const error = api.registry.findMetaError(mod);

                if (error.section && error.name) {
                  msg = `${transactionType} failed: ${error.name}`;
                }
              }

              toast.error(msg);
              callback?.({ finalized: true, status: "ERROR", message: msg });
            }
          }
        },
      );
    } catch (err) {
      toast.error(err as string);
    }
  }

  // == Transactions ==

  async function addStake({
    validator,
    amount,
    callback,
  }: Stake): Promise<void> {
    if (!api?.tx.subspaceModule?.addStake) return;

    const transaction = api.tx.subspaceModule.addStake(
      validator,
      calculateAmount(amount),
    );
    await sendTransaction("Staking", transaction, callback);
  }

  async function removeStake({
    validator,
    amount,
    callback,
  }: Stake): Promise<void> {
    if (!api?.tx.subspaceModule?.removeStake) return;

    const transaction = api.tx.subspaceModule.removeStake(
      validator,
      calculateAmount(amount),
    );
    await sendTransaction("Unstaking", transaction, callback);
  }

  async function transfer({ to, amount, callback }: Transfer): Promise<void> {
    if (!api?.tx.balances.transferAllowDeath) return;
    const transaction = api.tx.balances.transferAllowDeath(
      to,
      calculateAmount(amount),
    );
    await sendTransaction("Transfer", transaction, callback);
  }

  async function transferStake({
    fromValidator,
    toValidator,
    amount,
    callback,
  }: TransferStake): Promise<void> {
    if (!api?.tx.subspaceModule?.transferStake) return;

    const transaction = api.tx.subspaceModule.transferStake(
      fromValidator,
      toValidator,
      calculateAmount(amount),
    );
    await sendTransaction("Transfer Stake", transaction, callback);
  }

  // == Subspace ==

  async function registerModule({
    subnetName,
    address,
    name,
    moduleId,
    metadata,
    callback,
  }: RegisterModule): Promise<void> {
    if (!api?.tx.subspaceModule?.register) return;

    console.log(api.tx.subspaceModule);

    const transaction = api.tx.subspaceModule.register(
      subnetName,
      name,
      address,
      moduleId,
      metadata,
    );
    await sendTransaction("Register Module", transaction, callback);
  }

  // == Governance ==

  async function voteProposal({
    proposalId,
    vote,
    callback,
  }: Vote): Promise<void> {
    if (!api?.tx.governanceModule?.voteProposal) return;

    const transaction = api.tx.governanceModule.voteProposal(proposalId, vote);
    await sendTransaction("Vote", transaction, callback);
  }

  async function removeVoteProposal({
    proposalId,
    callback,
  }: RemoveVote): Promise<void> {
    if (!api?.tx.governanceModule?.removeVoteProposal) return;

    const transaction = api.tx.governanceModule.removeVoteProposal(proposalId);
    await sendTransaction("Remove Vote Proposal", transaction, callback);
  }

  async function addCustomProposal({
    IpfsHash,
    callback,
  }: AddCustomProposal): Promise<void> {
    if (!api?.tx.governanceModule?.addGlobalCustomProposal) return;

    const transaction =
      api.tx.governanceModule.addGlobalCustomProposal(IpfsHash);
    await sendTransaction("Create Custom Proposal", transaction, callback);
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
    await sendTransaction("Create S2 Application", transaction, callback);
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
      calculateAmount(value),
      dest,
    );
    await sendTransaction(
      "Create Transfer Dao Treasury Proposal",
      transaction,
      callback,
    );
  }

  async function estimateFee(
    recipientAddress: string,
    amount: string,
  ): Promise<Balance | null> {
    try {
      // Check if the API is ready and has the transfer function
      if (!api || !api.isReady) {
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

      return info.partialFee;
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
      !api?.tx.governanceModule.disableVotePowerDelegation
    )
      return;

    const transaction = isDelegating
      ? api.tx.governanceModule.enableVotePowerDelegation()
      : api.tx.governanceModule.disableVotePowerDelegation();

    await sendTransaction(
      "Update Delegating Voting Power",
      transaction,
      callback,
    );
  }

  // Hooks

  // Last block with API
  const { data: lastBlock, isLoading: isLastBlockLoading } = useLastBlock(api);

  // Balance

  const { data: balance, isLoading: isBalanceLoading } = useBalance(
    lastBlock?.apiAtBlock,
    selectedAccount?.address,
  );

  // Dao Treasury
  const { data: daoTreasury, isLoading: isDaoTreasuryLoading } = useDaoTreasury(
    lastBlock?.apiAtBlock,
  );

  // Not Delegating Voting Power Set
  const { data: notDelegatingVoting, isLoading: isNotDelegatingVotingLoading } =
    useNotDelegatingVoting(lastBlock?.apiAtBlock);

  // Unrewarded Proposals
  const { data: unrewardedProposals, isLoading: isUnrewardedProposalsLoading } =
    useUnrewardedProposals(lastBlock?.apiAtBlock);

  // Reward Allocation
  const { data: rewardAllocation, isLoading: isRewardAllocationLoading } =
    useRewardAllocation(lastBlock?.apiAtBlock);

  // Stake Out
  const { data: stakeOut, isLoading: isStakeOutLoading } =
    useAllStakeOut(torusCacheUrl);

  // User Total Staked
  const { data: userTotalStaked, isLoading: isUserTotalStakedLoading } =
    useUserTotalStaked(lastBlock?.apiAtBlock, selectedAccount?.address);

  // Proposals
  const { data: proposalQuery, isLoading: isProposalsLoading } = useProposals(
    lastBlock?.apiAtBlock,
  );

  // Custom Metadata for Proposals
  const customProposalMetadataQueryMap = useCustomMetadata<BaseProposal>(
    "proposal",
    lastBlock,
    proposalQuery,
  );

  const proposalsWithMeta = proposalQuery?.map((proposal) => {
    const id = proposal.id;
    const metadataQuery = customProposalMetadataQueryMap.get(id);
    const data = metadataQuery?.data;
    if (data == null) {
      return proposal;
    }
    const [, customData] = data;
    return { ...proposal, customData };
  });

  // Daos

  const { data: daosQuery, isLoading: isDaosLoading } = useDaos(
    lastBlock?.apiAtBlock,
  );
  const customDaoMetadataQueryMap = useCustomMetadata<BaseDao>(
    "dao",
    lastBlock,
    daosQuery,
  );

  const daosWithMeta = daosQuery?.map((dao) => {
    const id = dao.id;
    const metadataQuery = customDaoMetadataQueryMap.get(id);
    const data = metadataQuery?.data;
    if (data == null) {
      return dao;
    }
    const [, customData] = data;
    return { ...dao, customData };
  });

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
        torusCacheUrl,
        isConnected,
        setIsConnected,
        isInitialized,
        estimateFee,
        accounts,
        selectedAccount,
        setSelectedAccount,
        handleGetWallets,
        handleConnect,

        handleWalletModal,
        openWalletModal,

        balance,
        isBalanceLoading,

        addStake,
        removeStake,
        transfer,
        transferStake,

        registerModule,

        voteProposal,
        removeVoteProposal,
        addCustomProposal,
        addDaoApplication,
        addTransferDaoTreasuryProposal,

        updateDelegatingVotingPower,

        lastBlock,
        isLastBlockLoading,

        daoTreasury,
        isDaoTreasuryLoading,

        notDelegatingVoting,
        isNotDelegatingVotingLoading,

        unrewardedProposals,
        isUnrewardedProposalsLoading,

        rewardAllocation,
        isRewardAllocationLoading,

        stakeOut,
        isStakeOutLoading,

        userTotalStaked,
        isUserTotalStakedLoading,

        proposalsWithMeta,
        isProposalsLoading,

        daosWithMeta,
        isDaosLoading,

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
