import type { ApiPromise } from "@polkadot/api";
import { Keyring } from "@polkadot/api";
import { encodeAddress } from "@polkadot/util-crypto";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import type { SS58Address } from "../../types/index.js";
import type { EmissionProposal } from "./governance-types.js";

const ADDRESS_FORMAT = 42;

// ==== Whitelist ====

export async function pushToWhitelist(
  api: ApiPromise,
  moduleKey: SS58Address,
  mnemonic: string | undefined,
) {
  if (!mnemonic) {
    throw new Error("No sudo mnemonic provided");
  }

  const [keyringError, keyring] = trySync(
    () => new Keyring({ type: "sr25519" }),
  );

  if (keyringError !== undefined) {
    console.error("Error creating keyring:", keyringError);
    throw keyringError;
  }

  const [keypairError, sudoKeypair] = trySync(() =>
    keyring.addFromUri(mnemonic),
  );

  if (keypairError !== undefined) {
    console.error("Error creating keypair from mnemonic:", keypairError);
    throw keypairError;
  }

  const [encodeError, accountId] = trySync(() =>
    encodeAddress(moduleKey, ADDRESS_FORMAT),
  );

  if (encodeError !== undefined) {
    console.error("Error encoding address:", encodeError);
    throw encodeError;
  }

  const [txError, tx] = trySync(() =>
    api.tx.governance.addToWhitelist(accountId),
  );

  if (txError !== undefined) {
    console.error("Error creating transaction:", txError);
    throw txError;
  }

  const [sendError, extrinsic] = await tryAsync(
    (() => tx.signAndSend(sudoKeypair))(),
  );

  if (sendError !== undefined) {
    console.error("Error signing and sending transaction:", sendError);
    return false;
  }

  console.log("Extrinsic:", extrinsic.hash.toHex());
  return true;
}

export async function removeFromWhitelist(
  api: ApiPromise,
  moduleKey: SS58Address,
  mnemonic: string | undefined,
) {
  if (!mnemonic) {
    throw new Error("No sudo mnemonic provided");
  }

  const [encodeError, accountId] = trySync(() =>
    encodeAddress(moduleKey, ADDRESS_FORMAT),
  );

  if (encodeError !== undefined) {
    console.error("Error encoding address for whitelist removal:", encodeError);
    throw encodeError;
  }

  const [txError, tx] = trySync(() =>
    api.tx.governance.removeFromWhitelist(accountId),
  );

  if (txError !== undefined) {
    console.error("Error creating transaction for whitelist removal:", txError);
    throw txError;
  }

  const [keyringError, keyring] = trySync(
    () => new Keyring({ type: "sr25519" }),
  );

  if (keyringError !== undefined) {
    console.error(
      "Error creating keyring for whitelist removal:",
      keyringError,
    );
    throw keyringError;
  }

  const [keypairError, sudoKeypair] = trySync(() =>
    keyring.addFromUri(mnemonic),
  );

  if (keypairError !== undefined) {
    console.error(
      "Error creating keypair for whitelist removal:",
      keypairError,
    );
    throw keypairError;
  }

  const [sendError, extrinsic] = await tryAsync(tx.signAndSend(sudoKeypair));

  if (sendError !== undefined) {
    console.error(
      "Error signing and sending whitelist removal transaction:",
      sendError,
    );
    throw sendError;
  }

  return extrinsic;
}

// TODO: receive key instead of mnemonic
export async function acceptApplication(
  api: ApiPromise,
  proposalId: number,
  mnemonic: string,
) {
  if (!mnemonic) {
    throw new Error("No sudo mnemonic provided to accept application");
  }

  const [txError, tx] = trySync(() =>
    api.tx.governance.acceptApplication(proposalId),
  );

  if (txError !== undefined) {
    console.error(
      "Error creating transaction for accepting application:",
      txError,
    );
    throw txError;
  }

  const [keyringError, keyring] = trySync(
    () => new Keyring({ type: "sr25519" }),
  );

  if (keyringError !== undefined) {
    console.error(
      "Error creating keyring for accepting application:",
      keyringError,
    );
    throw keyringError;
  }

  const [keypairError, sudoKeypair] = trySync(() =>
    keyring.addFromUri(mnemonic),
  );

  if (keypairError !== undefined) {
    console.error(
      "Error creating keypair for accepting application:",
      keypairError,
    );
    throw keypairError;
  }

  const [sendError, extrinsic] = await tryAsync(tx.signAndSend(sudoKeypair));

  if (sendError !== undefined) {
    console.error(
      "Error signing and sending accept application transaction:",
      sendError,
    );
    throw sendError;
  }

  return extrinsic;
}

export async function penalizeAgent(
  api: ApiPromise,
  agentKey: string,
  penaltyFactor: number,
  mnemonic: string,
) {
  if (!mnemonic) {
    throw new Error("No sudo mnemonic provided to penalize agent");
  }

  const [txError, tx] = trySync(() =>
    api.tx.governance.penalizeAgent(agentKey, penaltyFactor),
  );

  if (txError !== undefined) {
    console.error("Error creating transaction for penalizing agent:", txError);
    throw txError;
  }

  const [keyringError, keyring] = trySync(
    () => new Keyring({ type: "sr25519" }),
  );

  if (keyringError !== undefined) {
    console.error("Error creating keyring for penalizing agent:", keyringError);
    throw keyringError;
  }

  const [keypairError, sudoKeypair] = trySync(() =>
    keyring.addFromUri(mnemonic),
  );

  if (keypairError !== undefined) {
    console.error("Error creating keypair for penalizing agent:", keypairError);
    throw keypairError;
  }

  const [sendError, extrinsic] = await tryAsync(tx.signAndSend(sudoKeypair));

  if (sendError !== undefined) {
    console.error(
      "Error signing and sending penalize agent transaction:",
      sendError,
    );
    throw sendError;
  }

  return extrinsic;
}

export async function denyApplication(
  api: ApiPromise,
  proposalId: number,
  mnemonic: string | undefined,
) {
  if (!mnemonic) {
    throw new Error("No sudo mnemonic provided");
  }

  const [txError, tx] = trySync(() =>
    api.tx.governance.denyApplication(proposalId),
  );
  const [keyringError, keyring] = trySync(
    () => new Keyring({ type: "sr25519" }),
  );

  if (txError !== undefined) {
    console.error(
      "Error creating transaction for denying application:",
      txError,
    );
    throw txError;
  }

  if (keyringError !== undefined) {
    console.error(
      "Error creating keyring for denying application:",
      keyringError,
    );
    throw keyringError;
  }

  const [keypairError, sudoKeypair] = trySync(() =>
    keyring.addFromUri(mnemonic),
  );

  if (keypairError !== undefined) {
    console.error(
      "Error creating keypair for denying application:",
      keypairError,
    );
    throw keypairError;
  }

  const [sendError, extrinsic] = await tryAsync(tx.signAndSend(sudoKeypair));

  if (sendError !== undefined) {
    console.error(
      "Error signing and sending deny application transaction:",
      sendError,
    );
    throw sendError;
  }

  return extrinsic;
}

export function addEmissionProposal({
  api,
  recyclingPercentage,
  treasuryPercentage,
  incentivesRatio,
  data,
}: EmissionProposal) {
  return api.tx.governance.addEmissionProposal(
    recyclingPercentage,
    treasuryPercentage,
    incentivesRatio,
    data,
  );
}

// ==== Proposal Voting ====

/**
 * Vote on a governance proposal
 */
export function voteProposal(
  api: ApiPromise,
  proposalId: number,
  vote: boolean,
) {
  return api.tx.governance.voteProposal(proposalId, vote);
}

/**
 * Remove vote from a governance proposal
 */
export function removeVoteProposal(api: ApiPromise, proposalId: number) {
  return api.tx.governance.removeVoteProposal(proposalId);
}

/**
 * Create a custom governance proposal
 */
export function addGlobalCustomProposal(api: ApiPromise, ipfsHash: string) {
  return api.tx.governance.addGlobalCustomProposal(ipfsHash);
}

/**
 * Submit an agent application for whitelist
 */
export function submitApplication(
  api: ApiPromise,
  applicationKey: SS58Address,
  ipfsHash: string,
  removing: boolean,
) {
  return api.tx.governance.submitApplication(
    applicationKey,
    ipfsHash,
    removing,
  );
}

/**
 * Create a DAO treasury transfer proposal
 */
export function addDaoTreasuryTransferProposal(
  api: ApiPromise,
  value: bigint,
  destinationKey: SS58Address,
  data: string,
) {
  return api.tx.governance.addDaoTreasuryTransferProposal(
    value,
    destinationKey,
    data,
  );
}

// ==== Vote Delegation ====

/**
 * Enable vote delegation for the current account
 */
export function enableVoteDelegation(api: ApiPromise) {
  return api.tx.governance.enableVoteDelegation();
}

/**
 * Disable vote delegation for the current account
 */
export function disableVoteDelegation(api: ApiPromise) {
  return api.tx.governance.disableVoteDelegation();
}
