// == Transactions ==

import type { EmissionProposal, PermissionId } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";

export interface TransactionResult {
  finalized: boolean;
  message: string | null;
  status: "SUCCESS" | "ERROR" | "PENDING" | "STARTING" | null;
  hash?: string;
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

export interface RegisterAgent {
  agentKey: SS58Address;
  name: string;
  url: string;
  metadata: string;
  callback?: (status: TransactionResult) => void;
}

export type UpdateAgent = Pick<RegisterAgent, "url" | "metadata" | "callback">;

export interface AddCustomProposal {
  IpfsHash: string;
  callback?: (status: TransactionResult) => void;
}

export interface AddDaoTreasuryTransferProposal {
  value: string;
  destinationKey: string;
  data: string; // IpfsHash

  callback?: (status: TransactionResult) => void;
}

export interface AddEmissionProposal extends Omit<EmissionProposal, "api">, TransactionHelpers {}

export interface AddAgentApplication extends TransactionHelpers {
  IpfsHash: string;
  applicationKey: string;
  removing: boolean;
}

export interface UpdateDelegatingVotingPower extends TransactionHelpers {
  isDelegating: boolean;
}

export interface RevokePermission extends TransactionHelpers {
  permissionId: PermissionId;
}

export interface CreateNamespace extends TransactionHelpers {
  path: string;
}

export interface DeleteNamespace extends TransactionHelpers {
  path: string;
}

export interface RemarkTransaction extends TransactionHelpers {
  remark: string;
}
