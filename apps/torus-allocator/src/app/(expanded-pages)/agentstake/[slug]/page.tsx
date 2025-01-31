import { Container, Card } from "@torus-ts/ui";
import { notFound } from "next/navigation";
import { api } from "~/trpc/server";

export default async function UserAgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<JSX.Element> {
  const { slug } = await params;

  if (!slug) {
    console.log("WAAHOOO");
    return <div>WAHOOOO</div>;
  }

  const [userKey, agentKey] = slug.split("-");

  if (!userKey) {
    console.log(`User key not provided`);
    notFound();
  }

  const data = await api.userAgentWeight.normalizedWeight({
    userKey: userKey,
    agentKey: agentKey,
  });

  return (
    <Container>
      <div className="mx-auto pb-16 text-white">
        <h1 className="mb-4 text-3xl font-semibold">User Agent Page</h1>
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h2 className="mb-2 text-xl font-semibold">Staker details</h2>
            <p>User Key: {userKey}</p>
            {/* Add more user details as needed */}
          </Card>
          {agentKey ? (
            <Card className="p-6">
              <h2 className="mb-2 text-xl font-semibold">Agent Details</h2>
              <p>Agent Key: {agentKey}</p>
              <p>Normalized Weight: {data[agentKey]}</p>
              {/* Add more agent details as needed */}
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="mb-2 text-xl font-semibold">
                Normalized Weights for All Agents
              </h2>
              {Object.entries(data).map(([key, value]) => (
                <p key={key}>
                  {key}: {value}
                </p>
              ))}
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}
