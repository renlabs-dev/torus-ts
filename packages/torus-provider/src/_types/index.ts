// == Transactions ==

export interface TransactionResult {
  finalized: boolean;
  message: string | null;
  status: "SUCCESS" | "ERROR" | "PENDING" | "STARTING" | null;
}

// TODO: amount field should be `bigint`

export interface Stake {
  validator: string;
  amount: string;
  callback?: (status: TransactionResult) => void;
  refetchHandler: () => Promise<void>;
}

export interface Transfer {
  to: string;
  amount: string;
  callback?: (status: TransactionResult) => void;
  refetchHandler: () => Promise<void>;
}

export interface Bridge {
  amount: string;
  callback?: (status: TransactionResult) => void;
  refetchHandler: () => Promise<void>;
}

export interface TransferStake {
  fromValidator: string;
  toValidator: string;
  amount: string;
  callback?: (status: TransactionResult) => void;
  refetchHandler: () => Promise<void>;
}

// == Governance ==

export interface Vote {
  proposalId: number;
  vote: boolean;
  callback?: (status: TransactionResult) => void;
}

export interface RemoveVote {
  proposalId: number;
  callback?: (status: TransactionResult) => void;
}

export interface RegisterAgent {
  subnetName: string;
  address: string;
  name: string;
  moduleId: string;
  metadata: string;
  callback?: (status: TransactionResult) => void;
}

export interface AddCustomProposal {
  IpfsHash: string;
  callback?: (status: TransactionResult) => void;
}

export interface addTransferDaoTreasuryProposal {
  IpfsHash: string;
  value: string;
  dest: string;
  callback?: (status: TransactionResult) => void;
}

export interface AddDaoApplication {
  IpfsHash: string;
  applicationKey: string;
  callback?: (status: TransactionResult) => void;
}

export interface UpdateDelegatingVotingPower {
  isDelegating: boolean;
  callback?: (status: TransactionResult) => void;
}
