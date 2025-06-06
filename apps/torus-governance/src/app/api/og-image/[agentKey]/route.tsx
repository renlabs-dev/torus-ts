import { fetchAgentMetadata } from "@torus-network/sdk";
import { api } from "~/trpc/server";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ImageResponse } from "next/og";

export const runtime = "edge";

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
  const iconBase64 = Buffer.from(iconBuffer).toString("base64");
  const iconDataUrl = `data:image/png;base64,${iconBase64}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <img
          src={iconDataUrl}
          width={400}
          height={400}
          alt="Agent icon"
          style={{ borderRadius: "20px" }}
        />
        <p style={{ fontSize: 32, color: "#000" }}>{agent.name ?? "Agent"}</p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
