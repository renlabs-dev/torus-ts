'use client';

import { Suspense, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@torus-ts/ui/components/tabs";
import { ReceiveAction } from "~/app/components/actions/receive";
import { SendAction } from "~/app/components/actions/send";
import { WalletSkeletonLoader } from "~/app/components/wallet-skeleton-loader";
import { usePathname, useRouter } from "next/navigation";

const transferButtons = [
  { text: "Send", value: "send", component: <SendAction /> },
  { text: "Receive", value: "receive", component: <ReceiveAction /> },
];

export default function TransfersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Determina a tab ativa baseada na rota
  const getActiveTab = () => {
    const currentTab = pathname.split('/').pop();
    return transferButtons.some(tab => tab.value === currentTab)
      ? currentTab
      : 'send'; // default
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/transfers/${value}`);
  };

  return (
    <Suspense fallback={<WalletSkeletonLoader />}>
      <div className="container mx-auto p-4">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="animate-fade flex w-full flex-col gap-4"
        >
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${transferButtons.length}, 1fr)` }}>
            {transferButtons.map((button) => (
              <TabsTrigger key={button.value} value={button.value}>
                {button.text}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Renderiza os conteúdos das tabs */}
          {transferButtons.map((button) => (
            <TabsContent key={button.value} value={button.value}>
              {button.component}
            </TabsContent>
          ))}
        </Tabs>

        {/* Renderiza as páginas específicas (opcional) */}
        {children}
      </div>
    </Suspense>
  );
}
