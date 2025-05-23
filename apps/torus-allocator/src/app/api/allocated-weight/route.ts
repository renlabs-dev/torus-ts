import type { SS58Address } from "@torus-network/sdk";
import { api } from "~/trpc/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import SuperJSON from "superjson";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
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

    return NextResponse.json(SuperJSON.serialize(stakeWeightObject).json, {
      status: 200,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
