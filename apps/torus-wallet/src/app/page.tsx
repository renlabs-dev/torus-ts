import type { TabItem } from "~/app/_components/tab-layout";
import { TabLayout } from "~/app/_components/tab-layout";
import { Receive } from "~/app/transfers/_components/receive/receive";
import { Send } from "~/app/transfers/_components/send/send";

const tabs: TabItem[] = [
  { text: "Send", value: "send", component: <Send /> },
  { text: "Receive", value: "receive", component: <Receive /> },
];

export default function Page() {
  return <TabLayout tabs={tabs} defaultTab="send" />;
}
