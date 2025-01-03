// == Transactions ==

export interface TransactionResult {
  finalized: boolean;
  message: string | null;
  status: "SUCCESS" | "ERROR" | "PENDING" | "STARTING" | null;
}

// TODO: amount field should be `bigint`

export interface TransactionHelpers {
  callback?: (status: TransactionResult) => void;
  refetchHandler: () => Promise<void>;
}

export interface Stake extends TransactionHelpers {
  validator: string;
  amount: string;
}

export interface Transfer extends TransactionHelpers {
  to: string;
  amount: string;
}

export interface TransferStake extends TransactionHelpers {
  fromValidator: string;
  toValidator: string;
  amount: string;
}

// == Governance ==

export interface Vote extends TransactionHelpers {
  proposalId: number;
  vote: boolean;
}

export interface RemoveVote extends TransactionHelpers {
  proposalId: number;
}

export interface registerAgent {
  agentKey: string;
  name: string;
  url: string;
  metadata: string;
  callback?: (status: TransactionResult) => void;
}

export interface AddCustomProposal {
  IpfsHash: string;
  callback?: (status: TransactionResult) => void;
}

export interface addDaoTreasuryTransferProposal {
  value: string;
  destinationKey: string;
  data: string; // IpfsHash

  callback?: (status: TransactionResult) => void;
}

export interface AddAgentApplication extends TransactionHelpers {
  IpfsHash: string;
  applicationKey: string;
  removing: boolean;
}

export interface UpdateDelegatingVotingPower extends TransactionHelpers {
  isDelegating: boolean;
}
