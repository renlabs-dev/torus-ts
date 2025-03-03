import { z } from "zod";

const chainEnvSchema = z.enum(["mainnet", "testnet"]);

const getChainEnvPrefix = () => {
  const chainEnvResult = chainEnvSchema.safeParse(
    process.env.NEXT_PUBLIC_TORUS_CHAIN_ENV,
  );

  if (!chainEnvResult.success) {
    throw new Error(
      "Environment variable NEXT_PUBLIC_TORUS_CHAIN_ENV must be set to either 'mainnet' or 'testnet'",
    );
  }

  return chainEnvResult.data === "mainnet" ? "" : `${chainEnvResult.data}.`;
};

const createTorusUrl = (subdomain: string) =>
  `https://${subdomain}.${getChainEnvPrefix()}torus.network`;

export const links = {
  about: "/about",
  docs: "https://docs.torus.network/",
  cadre: "/cadre",

  blog: "https://x.com/torus_network/articles",
  discord: "https://discord.gg/torus",
  github: "https://github.com/renlabs-dev",
  telegram: "https://t.me/torusnetwork",
  x: "https://twitter.com/torus_network",

  ren_labs: "https://renlabs.dev/",

  hyperlane_gasDocs:
    "https://docs.hyperlane.xyz/docs/reference/hooks/interchain-gas",
  hyperlane_explorer: "https://explorer.hyperlane.xyz",

  torex_explorer: "https://torex.rs/",

  explorer: createTorusUrl("explorer"),
  governance: createTorusUrl("dao"),
  allocator: createTorusUrl("allocator"),
  landing_page: createTorusUrl("torus"),
  wallet: createTorusUrl("wallet"),
  bridge: createTorusUrl("bridge"),

  setup_a_wallet: "https://docs.torus.network/installation/setup-wallet",
};
