import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { Receive } from "~/app/(transfers)/_components/receive/receive";
import { Send } from "~/app/(transfers)/_components/send/send";
import type { TabItem } from "~/app/_components/tab-layout";
import { TabLayout } from "~/app/_components/tab-layout";
import { env } from "~/env";

// export const metadata = createSeoMetadata({
//   title: "Transfer Tokens - Torus Wallet",
//   description: "Send and receive digital assets securely with Torus Wallet",
//   keywords: [
//     "crypto wallet",
//     "torus",
//     "send tokens",
//     "receive tokens",
//     "transfer",
//     "web3",
//   ],
//   baseUrlFn: () => env("BASE_URL"),
//   canonical: "/transfers",
// });

const tabs: TabItem[] = [
  { text: "Send", value: "send", component: <Send /> },
  { text: "Receive", value: "receive", component: <Receive /> },
];

export default function TransfersPage() {
  return <TabLayout tabs={tabs} defaultTab="send" />;
}
