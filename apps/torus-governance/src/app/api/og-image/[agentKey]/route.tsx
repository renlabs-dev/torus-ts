import { fetchAgentMetadata } from "@torus-network/sdk";
import { api } from "~/trpc/server";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import Image from "next/image";

export async function GET(
  _req: NextRequest,
  { params }: { params: { agentKey: string } },
) {
  const agentKey = params.agentKey;
  if (!agentKey) {
    return NextResponse.redirect("/og.png");
  }

  const [agentError, agent] = await tryAsync(
    api.agent.byKeyLastBlock({ key: agentKey }),
  );

  if (agentError || !agent) {
    console.error("Error fetching agent data:", agentError);
    return NextResponse.redirect("/og.png");
  }

  const [metadataError, metadata] = agent.metadataUri
    ? await tryAsync(
        fetchAgentMetadata(agent.metadataUri, { fetchImages: true }),
      )
    : [null, null];

  if (metadataError || !metadata?.images.icon) {
    console.error("Error fetching agent metadata or no icon:", metadataError);
    return NextResponse.redirect("/og.png");
  }

  const iconBuffer = await metadata.images.icon.arrayBuffer();
  const iconDataUrl = `data:image/png;base64,${Buffer.from(iconBuffer).toString("base64")}`;

  return new ImageResponse(
    <Image src={iconDataUrl} width="400" height="400" alt="Agent icon" />,
    {
      width: 1200,
      height: 630,
    },
  );
}
