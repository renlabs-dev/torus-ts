export const CLAIM_EIP712_DOMAIN = {
  name: "TorusMigrationClaim",
  version: "1",
  chainId: 21000n,
} as const;

export const CLAIM_EIP712_TYPES = {
  Claim: [
    { name: "index", type: "uint256" },
    { name: "account", type: "address" },
    { name: "recipient", type: "address" },
    { name: "amount", type: "uint256" },
  ],
} as const;
