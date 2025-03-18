import { AgentBanner } from "../_components/agent-banner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-full w-full pt-12">
      <AgentBanner />
      <main className="flex flex-col items-center border-t pb-12">
        <div className="container px-4">
          <main className="py-10 text-white">
            <div className="flex flex-col gap-3 md:gap-6">
              <div className="flex flex-col">{children}</div>
            </div>
          </main>
        </div>
      </main>
    </div>
  );
}
