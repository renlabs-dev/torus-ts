import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { formatToken } from "@torus-network/torus-utils/torus/token";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

import { Card } from "@torus-ts/ui/components/card";
import { Container } from "@torus-ts/ui/components/container";

import { api } from "~/trpc/server";

export const metadata = createSeoMetadata({
  title: "Agent Stake Details - Torus Portal",
  description: "View detailed stake information for agents on the Torus Network. Analyze stake weights and user allocations.",
  keywords: ["agent stake", "stake weights", "user allocations", "stake details", "network stakes"],
  ogSiteName: "Torus Portal",
  canonical: "/root-allocator/agentstake",
  baseUrl: env("BASE_URL"),
});

export default async function UserAgentPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | undefined>>;
}>) {
  const params = await searchParams;
  const userKey = params.userKey;
  const agentKey = params.agentKey;

  const [dataError, data] = await tryAsync(
    api.userAgentWeight.stakeWeight({
      userKey: userKey,
      agentKey: agentKey,
    }),
  );
  if (dataError !== undefined) {
    console.error("Error fetching user agent weights:", dataError);
    return <div>Error fetching user agent weights</div>;
  }

  return (
    <Container>
      <div className="mx-auto pb-16 text-white">
        <h1 className="mb-4 text-3xl font-semibold">User Agent Page</h1>
        <div className="flex flex-col gap-6">
          {Array.from(data.entries()).map(([outerKey, innerMap]) => (
            <Card key={outerKey} className="p-6">
              <h2 className="mb-2 text-xl font-semibold">
                Stake Weights for User: {outerKey}
              </h2>
              {Array.from(innerMap.entries())
                .filter(([key]) => !agentKey || key === agentKey)
                .map(([agentKey, weight]) => (
                  <p key={agentKey}>
                    Agent: {agentKey}, Stake-weight: {formatToken(weight)}
                  </p>
                ))}
            </Card>
          ))}
        </div>
      </div>
    </Container>
  );
}
