import { cryptoWaitReady } from "@polkadot/util-crypto";
import { env } from "~/env";
import { WalletProof } from "~/lib/wallet-proof";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
    const { message } = body as { message?: unknown };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 },
      );
    }

    await cryptoWaitReady();

    const seedPhrase = env("TORUS_WALLET_SEED_PHRASE");

    if (!seedPhrase) {
      return NextResponse.json(
        { error: "TORUS_WALLET_SEED_PHRASE not configured" },
        { status: 500 },
      );
    }

    const walletProof = new WalletProof(seedPhrase);

    const signature = walletProof.signMessage(message);
    const address = walletProof.getAddressSS58();

    return NextResponse.json({
      signature: `0x${signature}`,
      address,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to sign message: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  }
}
