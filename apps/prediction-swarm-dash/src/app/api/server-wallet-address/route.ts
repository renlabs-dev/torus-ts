import { cryptoWaitReady } from "@polkadot/util-crypto";
import { env } from "~/env";
import { WalletProof } from "~/lib/wallet-proof";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await cryptoWaitReady();

    const seedPhrase = env("TORUS_WALLET_SEED_PHRASE");

    if (!seedPhrase) {
      return NextResponse.json(
        { error: "TORUS_WALLET_SEED_PHRASE not configured" },
        { status: 500 },
      );
    }

    const walletProof = new WalletProof(seedPhrase);
    const address = walletProof.getAddressSS58();

    return NextResponse.json({
      address,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to get server wallet address: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  }
}
