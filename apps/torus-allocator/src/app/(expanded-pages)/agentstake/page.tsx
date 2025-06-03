import { formatToken } from "@torus-network/torus-utils/subspace";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { Card } from "@torus-ts/ui/components/card";
import { Container } from "@torus-ts/ui/components/container";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { api } from "~/trpc/server";

export const generateMetadata = async ({ searchParams }: { searchParams: { userKey?: string; agentKey?: string } }) => {
  const userKey = searchParams.userKey;
  const agentKey = searchParams.agentKey;
  
  let title = "Agent Stake Details - Torus Allocator";
  let description = "View detailed stake information for agents on the Torus Network. Track stake weights and allocation metrics for specific agents.";
  
  // Enhance metadata with specifics if parameters are available
  if (agentKey) {
    try {
      const agent = await api.agent.byKeyLastBlock({ key: agentKey });
      if (agent?.name) {
        title = `${agent.name} Stake Details - Torus Allocator`;
        description = `View detailed stake information for ${agent.name} on the Torus Network. Track stake weights and allocation metrics.`;
      }
    } catch (error) {
      console.error("Error fetching agent metadata:", error);
    }
  }
  
  return createSeoMetadata({
    title,
    description,
    keywords: [
      "torus agent stake", 
      "torus network", 
      "stake weights", 
      "agent allocation metrics", 
      "stake delegation",
      userKey ? "user stake" : "",
      agentKey ? "agent details" : "",
    ].filter(Boolean),
    baseUrl: env("BASE_URL"),
    canonical: `/agentstake${agentKey ? `?agentKey=${agentKey}` : ""}${userKey ? `${agentKey ? "&" : "?"}userKey=${userKey}` : ""}`,
  });
};

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
