import { cryptoWaitReady } from "@polkadot/util-crypto";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { WalletProof } from "@/lib/wallet-proof";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    await cryptoWaitReady();

    const seedPhrase = env("TORUS_WALLET_SEED_PHRASE");

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
