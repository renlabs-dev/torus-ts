"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { createContext, useContext, useMemo } from "react";

import type { BaseDao, BaseProposal } from "@torus-ts/query-provider/hooks";
import type {
  AgentApplication,
  LastBlock,
  Proposal,
  SS58Address,
  StakeData,
} from "@torus-ts/subspace";
import type {
  ApplicationState,
  InjectedAccountWithMeta,
  ProposalState,
} from "@torus-ts/torus-provider";
import type {
  AddCustomProposal,
  AddAgentApplication,
  addTransferDaoTreasuryProposal,
  RegisterAgent,
  RemoveVote,
  Vote,
} from "@torus-ts/torus-provider/types";
import {
  useAccountsNotDelegatingVoting,
  useCachedStakeOut,
  useCustomMetadata,
  useAgentApplications,
  useDaoTreasuryAddress,
  useFreeBalance,
  useLastBlock,
  useProposals,
  useRewardAllocation,
  useUnrewardedProposals,
} from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Header, WalletDropdown } from "@torus-ts/ui";

import { env } from "~/env";

interface GovernanceContextType {
  isInitialized: boolean;
  lastBlock: UseQueryResult<LastBlock, Error>;

  isAccountConnected: boolean;
  isAccountPowerUser: boolean;
  selectedAccount: InjectedAccountWithMeta | null;
  accountFreeBalance: UseQueryResult<bigint, Error>;
  accountStakedBalance: bigint | undefined;

  stakeOut: UseQueryResult<StakeData, Error>;

  agentApplications: UseQueryResult<ApplicationState[], Error>;
  agentApplicationsWithMeta: ApplicationState[] | undefined;
  daoTreasuryAddress: UseQueryResult<SS58Address, Error>;
  daoTreasuryBalance: UseQueryResult<bigint, Error>;
  AddAgentApplication: (application: AddAgentApplication) => Promise<void>;
  addTransferDaoTreasuryProposal: (
    proposal: addTransferDaoTreasuryProposal,
  ) => Promise<void>;

  proposals: UseQueryResult<Proposal[], Error>;
  proposalsWithMeta: ProposalState[] | undefined;
  rewardAllocation: UseQueryResult<bigint, Error>;
  unrewardedProposals: UseQueryResult<number[], Error>;
  voteProposal: (vote: Vote) => Promise<void>;
  removeVoteProposal: (removeVote: RemoveVote) => Promise<void>;
  addCustomProposal: (proposal: AddCustomProposal) => Promise<void>;

  registerAgent: (registerAgent: RegisterAgent) => Promise<void>;
}

const GovernanceContext = createContext<GovernanceContextType | null>(null);

export function GovernanceProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  // == API Context ==
  const {
    api,
    isInitialized,
    selectedAccount,
    isAccountConnected,
    voteProposal,
    RegisterAgent,
    AddAgentApplication,
    addCustomProposal,
    removeVoteProposal,
    addTransferDaoTreasuryProposal,

    accounts,
    handleLogout,
    handleGetWallets,
    handleSelectWallet,
  } = useTorus();
  const lastBlock = useLastBlock(api);

  // == Account ==
  const accountFreeBalance = useFreeBalance(
    lastBlock.data?.apiAtBlock,
    selectedAccount?.address as SS58Address,
  );

  const accountsNotDelegatingVoting = useAccountsNotDelegatingVoting(
    lastBlock.data?.apiAtBlock,
  );

  const isAccountPowerUser = useMemo(() => {
    if (selectedAccount?.address && accountsNotDelegatingVoting.data) {
      const isUserPower = accountsNotDelegatingVoting.data.includes(
        selectedAccount.address as SS58Address,
      );
      return isUserPower;
    }
    return false;
  }, [selectedAccount, accountsNotDelegatingVoting]);

  // == Subspace ==
  const stakeOut = useCachedStakeOut(env.NEXT_PUBLIC_CACHE_PROVIDER_URL);

  const accountStakedBalance =
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
    stakeOut.data?.perAddr[selectedAccount?.address!];

  // == Proposals ==
  const proposals = useProposals(lastBlock.data?.apiAtBlock);
  const customProposalMetadataQueryMap = useCustomMetadata<BaseProposal>(
    "proposal",
    lastBlock.data,
    proposals.data,
  );
  const proposalsWithMeta = proposals.data?.map((proposal: Proposal) => {
    const id = proposal.id;
    const metadataQuery = customProposalMetadataQueryMap.get(id);
    const data = metadataQuery?.data;
    if (data == null) {
      return proposal;
    }
    const [, customData] = data;
    return { ...proposal, customData };
  });

  const rewardAllocation = useRewardAllocation(lastBlock.data?.apiAtBlock);

  const unrewardedProposals = useUnrewardedProposals(
    lastBlock.data?.apiAtBlock,
  );

  // == Agent Applications ==
  const agentApplications = useAgentApplications(lastBlock.data?.apiAtBlock);
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

  // == Treasury ==
  const daoTreasuryAddress = useDaoTreasuryAddress(lastBlock.data?.apiAtBlock);

  const daoTreasuryBalance = useFreeBalance(
    lastBlock.data?.apiAtBlock,
    daoTreasuryAddress.data,
  );

  return (
    <GovernanceContext.Provider
      value={{
        isInitialized,
        lastBlock,

        stakeOut,

        selectedAccount,
        isAccountPowerUser,
        isAccountConnected,
        accountFreeBalance,
        accountStakedBalance,

        agentApplications,
        agentApplicationsWithMeta,
        daoTreasuryAddress,
        daoTreasuryBalance,
        AddAgentApplication,
        addTransferDaoTreasuryProposal,

        proposals,
        proposalsWithMeta,
        rewardAllocation,
        unrewardedProposals,
        voteProposal,
        addCustomProposal,
        removeVoteProposal,

        registerAgent: RegisterAgent,
      }}
    >
      <Header
        appName="Governance Portal"
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
