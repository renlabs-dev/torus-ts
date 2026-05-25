import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { parseRelayBody, submitRelayedClaim } from "~/lib/relayer";
import { NextResponse } from "next/server";

export async function POST(req: Request): Promise<Response> {
  const [parseError, raw] = await tryAsync(req.json() as Promise<unknown>);
  if (parseError !== undefined) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = parseRelayBody(raw);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "invalid_body", detail: parsed.error },
      { status: 400 },
    );
  }

  const [relayError, result] = await tryAsync(submitRelayedClaim(parsed.body));

  if (relayError !== undefined) {
    return NextResponse.json(
      { error: "relay_failed", detail: relayError.message },
      { status: 500 },
    );
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, detail: result.detail },
      { status: result.status },
    );
  }

  return NextResponse.json({ txHash: result.txHash });
}
