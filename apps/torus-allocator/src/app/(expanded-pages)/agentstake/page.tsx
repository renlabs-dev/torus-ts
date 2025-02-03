import { Container, Card } from "@torus-ts/ui";
import { api } from "~/trpc/server";
import { formatToken } from "@torus-ts/utils/subspace";

export default async function UserAgentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<JSX.Element | string | Response>  {
  const params = await searchParams;
  const userKey = params.userKey;
  const agentKey = params.agentKey;

  const data = await api.userAgentWeight.stakeWeight({
    userKey: userKey,
    agentKey: agentKey,
  });

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
