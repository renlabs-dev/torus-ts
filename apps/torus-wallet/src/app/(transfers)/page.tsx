import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { Faucet } from "~/app/(transfers)/_components/faucet/faucet";
import { Receive } from "~/app/(transfers)/_components/receive/receive";
import { Send } from "~/app/(transfers)/_components/send/send";
import type { TabItem } from "~/app/_components/tab-layout";
import { TabLayout } from "~/app/_components/tab-layout";
import { env } from "~/env";

export const generateMetadata = () =>
  createSeoMetadata({
    title: "Transfer Tokens - Torus Wallet",
    description: "Send and receive digital assets securely with Torus Wallet",
    keywords: [
      "torus wallet",
      "torus send tokens",
      "torus receive tokens",
      "torus transfer tokens",
    ],
    baseUrl: env("BASE_URL"),
    canonical: "/transfers",
  });

export default function TransfersPage() {
  const tabs: TabItem[] = [
    { text: "Send", value: "send", component: <Send /> },
    { text: "Receive", value: "receive", component: <Receive /> },
  ];

  // TODO: Improve this check: check `NEXT_PUBLIC_TORUS_CHAIN_ENV` instead
  if (env("NEXT_PUBLIC_TORUS_RPC_URL").includes("testnet")) {
    tabs.push({ text: "Faucet", value: "faucet", component: <Faucet /> });
  }

  return <TabLayout tabs={tabs} defaultTab="send" />;
}
