import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "~/env";

export function config(): { api: { bodyParser: false } } {
  return {
    api: {
      bodyParser: false,
    },
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    data.append("file", file);
    data.append("pinataMetadata", JSON.stringify({ name: "File to upload" }));
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env("PINATA_JWT")}`,
      },
      body: data,
    });
    const { IpfsHash } = (await res.json()) as { IpfsHash: string };

    return NextResponse.json({ IpfsHash }, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
