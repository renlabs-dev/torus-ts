import { fetchAgentMetadata } from "@torus-network/sdk";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { promises as fs } from "fs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import path from "path";
import { api } from "~/trpc/server";

interface Params {
  agentKey: Promise<string>;
}

async function getDefaultImageResponse() {
  const filePath = path.join(process.cwd(), "public", "agent.png");
  const [error, fileBuffer] = await tryAsync(fs.readFile(filePath));

  if (error) {
    console.error("Error reading fallback image:", error);
    return new NextResponse("Default image not found.", { status: 500 });
  }

  const headers = new Headers();
  headers.set("Content-Type", "image/png");

  return new NextResponse(fileBuffer, {
    status: 200,
    headers,
  });
}

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const agentKey = await params.agentKey;

  if (!agentKey) {
    return getDefaultImageResponse();
  }

  const [agentError, agent] = await tryAsync(
    api.agent.byKeyLastBlock({ key: agentKey }),
  );

  if (agentError || !agent) {
    return getDefaultImageResponse();
  }

  const [metadataError, metadata] = agent.metadataUri
    ? await tryAsync(
        fetchAgentMetadata(agent.metadataUri, { fetchImages: true }),
      )
    : [null, null];

  if (metadataError || !metadata?.images.icon) {
    return getDefaultImageResponse();
  }

  const blob = metadata.images.icon;
  if (!(blob instanceof Blob)) {
    return getDefaultImageResponse();
  }

  const contentType = blob.type || "image/png";

  const headers = new Headers();
  headers.set("Content-Type", contentType);

  return new NextResponse(blob, { status: 200, headers });
}
