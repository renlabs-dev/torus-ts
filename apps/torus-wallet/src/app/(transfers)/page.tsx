import { Faucet } from "~/app/(transfers)/_components/faucet/faucet";
import { Receive } from "~/app/(transfers)/_components/receive/receive";
import { Send } from "~/app/(transfers)/_components/send/send";
import type { TabItem } from "~/app/_components/tab-layout";
import { TabLayout } from "~/app/_components/tab-layout";
import { env } from "~/env";
import { generateMetadata } from "~/utils/seo";

export const metadata = generateMetadata({
  title: "Transfer Tokens - Torus Wallet",
  description: "Send and receive digital assets securely with Torus Wallet",
  ogTitle: "Transfer Tokens - Torus Wallet",
  ogDescription: "Send and receive digital assets securely with Torus Wallet",
  twitterTitle: "Transfer Tokens - Torus Wallet",
  twitterDescription:
    "Send and receive digital assets securely with Torus Wallet",
  canonical: "/transfers",
  keywords: [
    "crypto wallet",
    "torus",
    "send tokens",
    "receive tokens",
    "transfer",
    "web3",
  ],
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
