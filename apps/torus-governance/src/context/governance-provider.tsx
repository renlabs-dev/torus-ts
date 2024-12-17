"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { createContext, useContext, useMemo } from "react";

import type { BaseDao, BaseProposal } from "@torus-ts/providers/hooks";
import type {
  DaoApplications,
  LastBlock,
  Proposal,
  SS58Address,
  StakeData,
} from "@torus-ts/subspace";
import type {
  DaoState,
  InjectedAccountWithMeta,
  ProposalState,
} from "@torus-ts/torus-provider";
import type {
  AddCustomProposal,
  AddDaoApplication,
  addTransferDaoTreasuryProposal,
  RegisterModule,
  RemoveVote,
  Vote,
} from "@torus-ts/torus-provider/types";
import {
  useAccountsNotDelegatingVoting,
  useCachedStakeOut,
  useCustomMetadata,
  useDaos,
  useDaoTreasuryAddress,
  useFreeBalance,
  useLastBlock,
  useModuleBurn,
  useProposals,
  useRewardAllocation,
  useSubnetList,
  useUnrewardedProposals,
} from "@torus-ts/providers/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { WalletDropdown } from "@torus-ts/ui";

interface GovernanceContextType {
  isInitialized: boolean;
  lastBlock: UseQueryResult<LastBlock, Error>;

  isAccountConnected: boolean;
  isAccountPowerUser: boolean;
  selectedAccount: InjectedAccountWithMeta | null;
  accountFreeBalance: UseQueryResult<bigint, Error>;
  accountStakedBalance: bigint | undefined;

  stakeOut: UseQueryResult<StakeData, Error>;

  daos: UseQueryResult<DaoApplications[], Error>;
  daosWithMeta: DaoState[] | undefined;
  daoTreasuryAddress: UseQueryResult<SS58Address, Error>;
  daoTreasuryBalance: UseQueryResult<bigint, Error>;
  addDaoApplication: (application: AddDaoApplication) => Promise<void>;
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

  subnetList: UseQueryResult<Record<string, string>, Error>;

  moduleBurn: UseQueryResult<Record<string, string>, Error>;
  registerModule: (registerModule: RegisterModule) => Promise<void>;
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
    registerModule,
    addDaoApplication,
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
  const stakeOut = useCachedStakeOut(
    // eslint-disable-next-line no-restricted-properties
    String(process.env.NEXT_PUBLIC_CACHE_PROVIDER_URL),
  );

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
  const proposalsWithMeta = proposals.data?.map((proposal) => {
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

  // == DAOs ==
  const daos = useDaos(lastBlock.data?.apiAtBlock);
  const customDaoMetadataQueryMap = useCustomMetadata<BaseDao>(
    "dao",
    lastBlock.data,
    daos.data,
  );
  const daosWithMeta = daos.data?.map((dao) => {
    const id = dao.id;
    const metadataQuery = customDaoMetadataQueryMap.get(id);
    const data = metadataQuery?.data;
    if (data == null) {
      return dao;
    }
    const [, customData] = data;
    return { ...dao, customData };
  });

  const daoTreasuryAddress = useDaoTreasuryAddress(lastBlock.data?.apiAtBlock);

  const daoTreasuryBalance = useFreeBalance(
    lastBlock.data?.apiAtBlock,
    daoTreasuryAddress.data,
  );

  // == Modules ==
  const subnetList = useSubnetList(lastBlock.data?.apiAtBlock);
  const moduleBurn = useModuleBurn(lastBlock.data?.apiAtBlock);

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

        daos,
        daosWithMeta,
        daoTreasuryAddress,
        daoTreasuryBalance,
        addDaoApplication,
        addTransferDaoTreasuryProposal,

        proposals,
        proposalsWithMeta,
        rewardAllocation,
        unrewardedProposals,
        voteProposal,
        addCustomProposal,
        removeVoteProposal,

        subnetList,

        moduleBurn,
        registerModule,
      }}
    >
      <WalletDropdown
        balance={accountFreeBalance.data}
        stakeOut={stakeOut.data}
        accounts={accounts}
        selectedAccount={selectedAccount}
        handleLogout={handleLogout}
        handleGetWallets={handleGetWallets}
        handleSelectWallet={handleSelectWallet}
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
