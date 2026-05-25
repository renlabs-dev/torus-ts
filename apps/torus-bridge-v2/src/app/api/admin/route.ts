import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { getRelayerStatus } from "~/lib/relayer";
import { NextResponse } from "next/server";

export async function GET(): Promise<Response> {
  const [error, status] = await tryAsync(getRelayerStatus());

  if (error !== undefined) {
    return NextResponse.json(
      { error: "status_unavailable", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(status);
}
