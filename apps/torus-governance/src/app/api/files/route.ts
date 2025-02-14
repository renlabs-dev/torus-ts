import type { CID } from "@torus-ts/utils/ipfs";
import { PINATA_PIN_FILE_RESULT } from "@torus-ts/utils/ipfs";
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

    const file = data.get("file");
    if (!(file instanceof File)) {
      throw new Error(`Key "file" should be a File`);
    }

    const { cid } = await pinFileOnPinata(file, file.name);

    return NextResponse.json({ cid: cid.toString() }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

const PINATA_PIN_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export interface PinFileOnPinataResponse {
  cid: CID;
}

async function pinFileOnPinata(
  file: File,
  name?: string,
): Promise<PinFileOnPinataResponse> {
  const PINATA_JWT = env("PINATA_JWT");

  const pinataOptions = {
    cidVersion: 1,
  };
  const pinataMetadata = {
    name: name ?? file.name,
  };

  const requestBody = new FormData();
  requestBody.append("pinataOptions", JSON.stringify(pinataOptions));
  requestBody.append("pinataMetadata", JSON.stringify(pinataMetadata));
  requestBody.append("file", file);

  const res = await fetch(PINATA_PIN_FILE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: requestBody,
  });

  const { IpfsHash } = PINATA_PIN_FILE_RESULT.parse(await res.json());

  return { cid: IpfsHash };
}
