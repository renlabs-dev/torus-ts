"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { createContext, useContext, useMemo } from "react";

import type { BaseDao, BaseProposal } from "@torus-ts/query-provider/hooks";
import type {
  AgentApplication,
  Api,
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
  addDaoTreasuryTransferProposal,
  registerAgent,
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
  useGlobalConfig,
} from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Header, WalletDropdown } from "@torus-ts/ui";

import { env } from "~/env";
import { toast } from "@torus-ts/toast-provider";
import { api as trpcApi } from "~/trpc/react";
import type { AppRouter } from "@torus-ts/api";
import type { inferProcedureOutput } from "@trpc/server";
import type { UseTRPCQueryResult } from "@trpc/react-query/shared";
import type { TRPCClientErrorLike } from "@trpc/client";

type CadreCandidates = inferProcedureOutput<AppRouter["cadreCandidate"]["all"]>;
type CadreList = inferProcedureOutput<AppRouter["cadre"]["all"]>;

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
    proposal: addDaoTreasuryTransferProposal,
  ) => Promise<void>;
  agentApplications: UseQueryResult<ApplicationState[], Error>;
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
  registerAgent: (registerAgent: registerAgent) => Promise<void>;
  removeVoteProposal: (removeVote: RemoveVote) => Promise<void>;
  rewardAllocation: UseQueryResult<bigint, Error>;
  selectedAccount: InjectedAccountWithMeta | null;
  stakeOut: UseQueryResult<StakeData, Error>;
  torusCacheUrl: string;
  unrewardedProposals: UseQueryResult<number[], Error>;
  voteProposal: (vote: Vote) => Promise<void>;
  isUserCadre: boolean;
  isUserCadreCandidate: boolean;
  cadreCandidates: UseTRPCQueryResult<
    CadreCandidates,
    TRPCClientErrorLike<AppRouter>
  >;
  cadreList: UseTRPCQueryResult<CadreList, TRPCClientErrorLike<AppRouter>>;
}

const GovernanceContext = createContext<GovernanceContextType | null>(null);

export function GovernanceProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
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

  const cadreList = trpcApi.cadre.all.useQuery();
  const isUserCadre = !!cadreList.data?.find(
    (cadre) => cadre.userKey === selectedAccount?.address,
  );

  const cadreCandidates = trpcApi.cadreCandidate.all.useQuery();

  const isUserCadreCandidate = !!cadreCandidates.data?.find(
    (user) => user.userKey === selectedAccount?.address,
  );

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
        api,
        cadreCandidates,
        cadreList,
        daoTreasuryAddress,
        daoTreasuryBalance,
        isAccountConnected,
        isAccountPowerUser,
        isInitialized,
        isUserCadre,
        isUserCadreCandidate,
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
      }}
    >
      <Header
        appName="DAO Portal"
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
            notifyCopy={() => toast.success("Copied to clipboard")}
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
