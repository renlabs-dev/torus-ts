import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { api } from "~/trpc/server";
import type { SS58Address } from "@torus-ts/subspace";
import SuperJSON from "superjson";

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
    const { searchParams } = new URL(request.url);
    const userKey = searchParams.get("userKey") as SS58Address | null;
    const agentKey = searchParams.get("agentKey") as SS58Address | null;

    // TODO: unholy levels of gambiarra here
    const stakeWeightMap = await api.userAgentWeight.stakeWeight({ userKey: userKey ?? undefined, agentKey: agentKey ?? undefined });

    return NextResponse.json(SuperJSON.serialize(stakeWeightMap), { status: 200 });
    } catch (e) {
    console.error(e);
    return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
    );
    }
}
