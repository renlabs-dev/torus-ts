import { Container } from "@torus-ts/ui/components/container";
import { AgentBanner } from "../_components/agent-banner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-full w-full pb-28 pt-12">
      <AgentBanner />
      <Container>
        <div className="-mt-16 flex flex-col">{children}</div>
      </Container>
    </div>
  );
}
