import { AgentBanner } from "../_components/agent-banner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-full w-full pt-12">
      <AgentBanner />
      {children}
    </div>
  );
}
