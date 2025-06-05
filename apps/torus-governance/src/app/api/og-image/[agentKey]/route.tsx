import { fetchAgentMetadata } from "@torus-network/sdk";
import { api } from "~/trpc/server";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ImageResponse } from "next/og";

// Define font files to be used
const interRegular = fetch(
  new URL(
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap",
  ),
).then((res) => res.arrayBuffer());

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: { agentKey: string } },
) {
  try {
    const agentKey = params.agentKey;
    if (!agentKey) {
      return NextResponse.json(
        { error: "Agent key is required" },
        { status: 400 },
      );
    }

    // Fetch agent data
    const [agentError, agent] = await tryAsync(
      api.agent.byKeyLastBlock({ key: agentKey }),
    );

    if (agentError !== undefined || !agent) {
      console.error("Error fetching agent data:", agentError);
      return generateDefaultOgImage(agentKey);
    }

    // Fetch agent metadata with images
    let agentMetadata = null;
    let agentIcon = null;

    if (agent.metadataUri) {
      const [metadataError, metadata] = await tryAsync(
        fetchAgentMetadata(agent.metadataUri, { fetchImages: true }),
      );

      if (!metadataError) {
        agentMetadata = metadata.metadata;
        agentIcon = metadata.images.icon;
      }
    }

    // Generate OG image with agent information
    return await generateAgentOgImage({
      agentName: agent.name ?? agentKey,
      description: agentMetadata?.short_description ?? "Agent on Torus Network",
      agentIcon,
    });
  } catch (error) {
    console.error("Error generating OG image:", error);
    return NextResponse.json(
      { error: "Failed to generate OG image" },
      { status: 500 },
    );
  }
}

async function generateAgentOgImage({
  agentName,
  description,
  agentIcon,
}: {
  agentName: string;
  description: string;
  agentIcon?: Blob | null;
}) {
  const fontData = await interRegular;

  // Prepare icon if available
  let iconDataUrl = null;
  if (agentIcon instanceof Blob) {
    const buffer = await agentIcon.arrayBuffer();
    iconDataUrl = `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          fontSize: 48,
          color: "white",
          background: "linear-gradient(135deg, #0f1729 0%, #1a2332 100%)",
          width: "100%",
          height: "100%",
          padding: "60px",
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: "30px",
        }}
      >
        {iconDataUrl ? (
          <img
            src={iconDataUrl}
            width="200"
            height="200"
            style={{
              borderRadius: "20px",
              border: "4px solid #00AEEF",
            }}
            alt="Agent icon"
          />
        ) : (
          <div
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "20px",
              background: "#00AEEF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "80px",
              color: "white",
            }}
          >
            🤖
          </div>
        )}
        
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            maxWidth: "900px",
          }}
        >
          <h1 
            style={{ 
              fontSize: "64px", 
              margin: 0, 
              lineHeight: 1.2,
              textAlign: "center",
            }}
          >
            {agentName.length > 30 ? `${agentName.substring(0, 30)}...` : agentName}
          </h1>
          
          <div
            style={{
              fontSize: "24px",
              opacity: 0.8,
              color: "#00AEEF",
              textAlign: "center",
            }}
          >
            TORUS NETWORK AGENT
          </div>
          
          {description && (
            <p
              style={{
                fontSize: "32px",
                margin: 0,
                opacity: 0.9,
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              {description.length > 100 ? `${description.substring(0, 100)}...` : description}
            </p>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}

async function generateDefaultOgImage(agentKey: string) {
  const fontData = await interRegular;

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          color: "white",
          background: "linear-gradient(135deg, #0f1729 0%, #1a2332 100%)",
          width: "100%",
          height: "100%",
          padding: "60px",
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: "30px",
        }}
      >
        <div
          style={{
            width: "180px",
            height: "180px",
            borderRadius: "20px",
            background: "#00AEEF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "80px",
          }}
        >
          🤖
        </div>
        <h1 style={{ fontSize: "54px", margin: 0 }}>
          {agentKey.length > 20 ? `${agentKey.substring(0, 20)}...` : agentKey}
        </h1>
        <p style={{ fontSize: "28px", opacity: 0.8, margin: 0 }}>
          Torus Network Agent
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}