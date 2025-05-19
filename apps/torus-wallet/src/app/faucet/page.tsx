import type { TabItem } from "~/app/_components/tab-layout";
import { TabLayout } from "~/app/_components/tab-layout";
import { Faucet } from "~/app/faucet/_components/faucet-receive";
import { generateMetadata } from "~/utils/seo";

export const metadata = generateMetadata({
  title: "Faucet - Torus Wallet",
  description: "Receive tokens on the testnet with the faucet",
  ogTitle: "Faucet - Torus Wallet",
  ogDescription: "Receive tokens on the testnet with the faucet",
  twitterTitle: "Faucet - Torus Wallet",
  twitterDescription: "Receive tokens on the testnet with the faucet",
  canonical: "/faucet",
  keywords: [
    "crypto wallet",
    "torus",
    "receive testnet tokens",
    "testnet tokens",
    "faucet",
    "web3",
  ],
});

const tabs: TabItem[] = [
  {
    text: "Receive Testnet Tokens",
    value: "receive-testnet-tokens",
    component: <Faucet />,
  },
];

export default function FaucetPage() {
  return <TabLayout tabs={tabs} defaultTab="faucet" />;
}
