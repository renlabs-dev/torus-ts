import { z } from "zod";

export const chainEnvSchema = z
  .string()
  .min(3, { message: "Value must be at least 3 characters long" })
  .transform((value) => value.toLowerCase())
  .refine(
    (value) => value === "mainnet" || value === "testnet" || value.length > 0,
    {
      message: "Value must be 'mainnet', 'testnet' or a non-empty string",
    },
  );

export type ChainEnv = z.infer<typeof chainEnvSchema>;

const getChainEnvPrefix = (chainEnv: ChainEnv) => {
  const chainEnvResult = chainEnvSchema.safeParse(chainEnv);

  if (!chainEnvResult.success) {
    throw new Error(chainEnvResult.error.message);
  }

  const chainEnvPrefix = chainEnvResult.data;

  return chainEnvPrefix === "mainnet" ? "" : `${chainEnvPrefix}.`;
};

const createTorusUrl = (chainEnv: ChainEnv) => (subdomain: string) =>
  subdomain === "torus"
    ? `https://${getChainEnvPrefix(chainEnv)}torus.network`
    : `https://${subdomain}.${getChainEnvPrefix(chainEnv)}torus.network`;

export const getLinks = (chainEnv: ChainEnv) => {
  const createUrl = createTorusUrl(chainEnv);

  return {
    about: "/about",
    docs: "https://docs.torus.network/",
    cadre: "/cadre",

    blog: "https://blog.torus.network/",
    discord: "https://discord.gg/torus",
    github: "https://github.com/renlabs-dev",
    telegram: "https://t.me/torusnetwork",
    x: "https://twitter.com/torus_network",

    ren_labs: "https://renlabs.dev/",

    hyperlane_gasDocs:
      "https://docs.hyperlane.xyz/docs/reference/hooks/interchain-gas",
    hyperlane_explorer: "https://explorer.hyperlane.xyz",

    torex_explorer: "https://torex.rs/",

    explorer: createUrl("explorer"),
    governance: createUrl("dao"),
    allocator: createUrl("allocator"),
    landing_page: createUrl("torus"),
    wallet: createUrl("wallet"),
    bridge: createUrl("bridge"),
    portal: createUrl("portal"),

    setup_a_wallet: "https://docs.torus.network/installation/setup-wallet",
  };
};
