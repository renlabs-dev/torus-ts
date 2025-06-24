import type { CID } from "@torus-network/torus-utils/ipfs";
import { PINATA_PIN_FILE_RESULT } from "@torus-network/torus-utils/ipfs";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { env } from "~/env";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function config(): { api: { bodyParser: false } } {
  return {
    api: {
      bodyParser: false,
    },
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Get form data
  const [formDataError, data] = await tryAsync(request.formData());
  if (formDataError !== undefined) {
    console.error("Error parsing form data:", formDataError);
    return NextResponse.json(
      { error: "Error parsing form data" },
      { status: 400 },
    );
  }

  // Validate file
  const file = data.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Key 'file' should be a File" },
      { status: 400 },
    );
  }

  // Pin file to IPFS
  const [pinError, pinResult] = await tryAsync(
    pinFileOnPinata(file, file.name),
  );
  if (pinError !== undefined) {
    console.error("Error pinning file to IPFS:", pinError);
    return NextResponse.json(
      { error: "Error uploading to IPFS" },
      { status: 500 },
    );
  }

  return NextResponse.json({ cid: pinResult.cid.toString() }, { status: 200 });
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

  // Make the API request to Pinata
  const [fetchError, res] = await tryAsync(
    fetch(PINATA_PIN_FILE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: requestBody,
    }),
  );

  if (fetchError !== undefined) {
    throw new Error(`Failed to upload to Pinata: ${fetchError.message}`);
  }

  // Parse the JSON response
  const [jsonError, jsonData] = await tryAsync(res.json());
  if (jsonError !== undefined) {
    throw new Error(`Failed to parse Pinata response: ${jsonError.message}`);
  }

  // Validate the response data
  const [parseError, parsedData] = await tryAsync(
    Promise.resolve(PINATA_PIN_FILE_RESULT.parse(jsonData)),
  );

  if (parseError !== undefined) {
    throw new Error(`Invalid response from Pinata: ${parseError.message}`);
  }

  return { cid: parsedData.IpfsHash };
}
