import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import SuperJSON from "superjson";

import type { SS58Address } from "@torus-network/sdk/types";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

import { api } from "~/trpc/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const [error, result] = await tryAsync(
    (async () => {
      const { searchParams } = new URL(request.url);
      const userKey = searchParams.get("userKey") as SS58Address | null;
      const agentKey = searchParams.get("agentKey") as SS58Address | null;

      // TODO: unholy levels of gambiarra here
      const stakeWeightMap = await api.userAgentWeight.stakeWeight({
        userKey: userKey ?? undefined,
        agentKey: agentKey ?? undefined,
      });
      const stakeWeightObject = Object.fromEntries(
        Array.from(stakeWeightMap.entries()).map(([key, value]) => [
          key,
          Object.fromEntries(Array.from(value.entries())),
        ]),
      );

      return SuperJSON.serialize(stakeWeightObject).json;
    })(),
  );

  if (error !== undefined) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  return NextResponse.json(result, {
    status: 200,
  });
}
