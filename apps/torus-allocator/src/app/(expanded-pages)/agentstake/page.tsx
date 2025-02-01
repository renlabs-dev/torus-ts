import { Container, Card } from "@torus-ts/ui";
import { notFound } from "next/navigation";
import { api } from "~/trpc/server";

export default async function UserAgentPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}): Promise<JSX.Element> {
  const userKey = searchParams.userKey;
  const agentKey = searchParams.agentKey;

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
            <h2 className="mb-2 text-xl font-semibold">User Details</h2>
            <p>User Key: {userKey}</p>
            {/* Add more user details as needed */}
          </Card>
          {(
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
