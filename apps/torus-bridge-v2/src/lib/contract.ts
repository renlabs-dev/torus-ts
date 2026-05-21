export const torusMigrationClaimAbi = [
  // Write
  {
    type: "function",
    name: "claimTo",
    stateMutability: "nonpayable",
    inputs: [
      { name: "index", type: "uint256" },
      { name: "account", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "proof", type: "bytes32[]" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  // Read
  {
    type: "function",
    name: "claimable",
    stateMutability: "view",
    inputs: [
      { name: "index", type: "uint256" },
      { name: "account", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "proof", type: "bytes32[]" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "isClaimed",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "merkleRoot",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  // Custom errors
  {
    type: "error",
    name: "AlreadyClaimed",
    inputs: [{ name: "index", type: "uint256" }],
  },
  {
    type: "error",
    name: "InvalidProof",
    inputs: [],
  },
  {
    type: "error",
    name: "InsufficientContractBalance",
    inputs: [
      { name: "requestedAmount", type: "uint256" },
      { name: "contractBalance", type: "uint256" },
    ],
  },
] as const;
