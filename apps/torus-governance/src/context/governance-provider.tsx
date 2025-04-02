"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type {
  Agent,
  AgentApplication,
  Api,
  LastBlock,
  Proposal,
  SS58Address,
  StakeData,
} from "@torus-network/sdk";
import type { BaseDao, BaseProposal } from "@torus-ts/query-provider/hooks";
import {
  useAccountsNotDelegatingVoting,
  useAgentApplications,
  useAgents,
  useBurnValue,
  useCachedStakeOut,
  useCustomMetadata,
  useDaoTreasuryAddress,
  useFreeBalance,
  useGlobalConfig,
  useLastBlock,
  useProposals,
  useRewardAllocation,
  useUnrewardedProposals,
  useWhitelist,
} from "@torus-ts/query-provider/hooks";
import type {
  ApplicationState,
  InjectedAccountWithMeta,
  ProposalState,
} from "@torus-ts/torus-provider";
import { useTorus } from "@torus-ts/torus-provider";
import type {
  AddAgentApplication,
  AddCustomProposal,
  AddDaoTreasuryTransferProposal,
  RegisterAgent,
  RemoveVote,
  Vote,
} from "@torus-ts/torus-provider/types";
import { Header } from "@torus-ts/ui/components/header";
import { WalletDropdown } from "@torus-ts/ui/components/wallet-dropdown/wallet-dropdown";
import { env } from "~/env";
import { useSignIn } from "hooks/use-sign-in";
import { createContext, useContext, useMemo } from "react";

interface GovernanceContextType {
  accountFreeBalance: UseQueryResult<bigint, Error>;
  accountsNotDelegatingVoting: UseQueryResult<SS58Address[], Error>;
  networkConfigs: UseQueryResult<
    {
      agentApplicationCost: bigint;
      agentApplicationExpiration: bigint;
      maxProposalRewardTreasuryAllocation: bigint;
      proposalCost: bigint;
      proposalExpiration: bigint;
      proposalRewardInterval: bigint;
      proposalRewardTreasuryAllocation: bigint;
    },
    Error
  >;
  accountStakedBalance: bigint | undefined;
  AddAgentApplication: (application: AddAgentApplication) => Promise<void>;
  addCustomProposal: (proposal: AddCustomProposal) => Promise<void>;
  addDaoTreasuryTransferProposal: (
    proposal: AddDaoTreasuryTransferProposal,
  ) => Promise<void>;
  agentApplications: UseQueryResult<ApplicationState[], Error>;
  agents: UseQueryResult<Map<SS58Address, Agent>, Error>;
  agentApplicationsWithMeta: ApplicationState[] | undefined;
  api: Api | null;
  daoTreasuryAddress: UseQueryResult<SS58Address, Error>;
  daoTreasuryBalance: UseQueryResult<bigint, Error>;
  isAccountConnected: boolean;
  isAccountPowerUser: boolean;
  isInitialized: boolean;
  lastBlock: UseQueryResult<LastBlock, Error>;
  proposals: UseQueryResult<Proposal[], Error>;
  proposalsWithMeta: ProposalState[] | undefined;
  registerAgent: (registerAgent: RegisterAgent) => Promise<void>;
  removeVoteProposal: (removeVote: RemoveVote) => Promise<void>;
  rewardAllocation: UseQueryResult<bigint, Error>;
  selectedAccount: InjectedAccountWithMeta | null;
  stakeOut: UseQueryResult<StakeData, Error>;
  torusCacheUrl: string;
  unrewardedProposals: UseQueryResult<number[], Error>;
  voteProposal: (vote: Vote) => Promise<void>;
  burnAmount: UseQueryResult<bigint, Error>;
  authenticateUser: () => Promise<void>;
  isUserAuthenticated: boolean | null;
  whitelist: UseQueryResult<SS58Address[], Error>;
}

const GovernanceContext = createContext<GovernanceContextType | null>(null);

export function GovernanceProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // == API Context ==
  const {
    accounts,
    AddAgentApplication,
    addCustomProposal,
    addDaoTreasuryTransferProposal,
    api,
    handleGetWallets,
    handleLogout,
    handleSelectWallet,
    isAccountConnected,
    isInitialized,
    registerAgent,
    removeVoteProposal,
    selectedAccount,
    torusCacheUrl,
    voteProposal,
  } = useTorus();

  const lastBlock = useLastBlock(api);

  // == Network ==

  const networkConfigs = useGlobalConfig(api);

  // == Account ==
  const accountFreeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const accountsNotDelegatingVoting = useAccountsNotDelegatingVoting(api);

  const isAccountPowerUser = useMemo(() => {
    if (selectedAccount?.address && accountsNotDelegatingVoting.data) {
      const isUserPower = accountsNotDelegatingVoting.data.includes(
        selectedAccount.address as SS58Address,
      );
      return isUserPower;
    }
    return false;
  }, [selectedAccount, accountsNotDelegatingVoting]);

  const { isUserAuthenticated, authenticateUser } = useSignIn();
  // == Subspace ==
  const stakeOut = useCachedStakeOut(env("NEXT_PUBLIC_TORUS_CACHE_URL"));

  const accountStakedBalance =
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
    stakeOut.data?.perAddr[selectedAccount?.address!];

  // == Proposals ==
  const proposals = useProposals(api);
  const customProposalMetadataQueryMap = useCustomMetadata<BaseProposal>(
    "proposal",
    lastBlock.data,
    proposals.data,
  );
  const proposalsWithMeta = proposals.data
    ?.map((proposal: Proposal) => {
      const id = proposal.id;
      const metadataQuery = customProposalMetadataQueryMap.get(id);
      const data = metadataQuery?.data;
      if (data == null) {
        return proposal;
      }
      const [, customData] = data;
      return { ...proposal, customData };
    })
    // Filter out proposals created by miskate due to confusion with Agent Applications
    .filter((proposal) => proposal.id !== 0 && proposal.id !== 1);

  const rewardAllocation = useRewardAllocation(lastBlock.data?.apiAtBlock);

  const unrewardedProposals = useUnrewardedProposals(
    lastBlock.data?.apiAtBlock,
  );

  // == Agent Applications ==
  const agentApplications = useAgentApplications(api);
  const agents = useAgents(api);

  const whitelist = useWhitelist(api);

  const appMetadataQueryMap = useCustomMetadata<BaseDao>(
    "application",
    lastBlock.data,
    agentApplications.data,
  );

  const agentApplicationsWithMeta = agentApplications.data?.map(
    (agent: AgentApplication) => {
      const id = agent.id;
      const metadataQuery = appMetadataQueryMap.get(id);
      const data = metadataQuery?.data;
      if (data == null) {
        return agent;
      }
      const [, customData] = data;
      return { ...agent, customData };
    },
  );

  const burnAmount = useBurnValue(api);

  // == Treasury ==
  const daoTreasuryAddress = useDaoTreasuryAddress(lastBlock.data?.apiAtBlock);

  const daoTreasuryBalance = useFreeBalance(api, daoTreasuryAddress.data);

  return (
    <GovernanceContext.Provider
      value={{
        accountFreeBalance,
        accountsNotDelegatingVoting,
        accountStakedBalance,
        AddAgentApplication,
        addCustomProposal,
        addDaoTreasuryTransferProposal,
        agentApplications,
        agentApplicationsWithMeta,
        agents,
        api,
        authenticateUser,
        burnAmount,
        daoTreasuryAddress,
        daoTreasuryBalance,
        isAccountConnected,
        isAccountPowerUser,
        isInitialized,
        isUserAuthenticated,
        lastBlock,
        networkConfigs,
        proposals,
        proposalsWithMeta,
        registerAgent,
        removeVoteProposal,
        rewardAllocation,
        selectedAccount,
        stakeOut,
        torusCacheUrl,
        unrewardedProposals,
        voteProposal,
        whitelist,
      }}
    >
      <Header
        appName="Torus DAO"
        wallet={
          <WalletDropdown
            balance={accountFreeBalance.data}
            stakeOut={stakeOut.data}
            accounts={accounts}
            isInitialized={isInitialized}
            selectedAccount={selectedAccount}
            handleLogout={handleLogout}
            handleGetWallets={handleGetWallets}
            handleSelectWallet={handleSelectWallet}
            torusChainEnv={env("NEXT_PUBLIC_TORUS_CHAIN_ENV")}
          />
        }
      />
      {children}
    </GovernanceContext.Provider>
  );
}

export const useGovernance = (): GovernanceContextType => {
  const context = useContext(GovernanceContext);
  if (context === null) {
    throw new Error("useGovernance must be used within a GovernanceProvider");
  }
  return context;
};
