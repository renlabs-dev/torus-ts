import { TabLayout } from "~/app/_components/tab-layout";
import { Faucet } from "~/app/(transfers)/_components/faucet/faucet";
import { Receive } from "~/app/(transfers)/_components/receive/receive";
import { Send } from "~/app/(transfers)/_components/send/send";
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
  return (
    <TabLayout
      tabs={[
        { text: "Send", component: <Send /> },
        { text: "Receive", component: <Receive /> },
        {
          text: "Faucet",
          component: <Faucet />,
          hidden: env("NEXT_PUBLIC_TORUS_CHAIN_ENV") !== "testnet",
        },
      ]}
      defaultTab="send"
    />
  );
}
