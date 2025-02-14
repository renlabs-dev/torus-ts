import { AgentBanner } from "../components/agent-banner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full w-full pt-12">
      <AgentBanner />
      {children}
    </div>
  );
}
