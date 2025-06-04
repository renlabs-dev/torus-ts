import { fetchAgentMetadata } from "@torus-network/sdk";
import { api } from "~/trpc/server";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import Image from "next/image";

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

    if (agentError !== undefined || !agent?.metadataUri) {
      console.error("Error fetching agent data:", agentError);
      return generateDefaultOgImage(agentKey);
    }

    // Fetch agent metadata with images
    const [metadataError, agentMetadata] = await tryAsync(
      fetchAgentMetadata(agent.metadataUri, { fetchImages: true }),
    );

    if (metadataError !== undefined) {
      console.error("Error fetching agent metadata:", metadataError);
      return generateDefaultOgImage(agentKey);
    }

    // Check if we have an icon
    if (!agentMetadata.images.icon) {
      return generateDefaultOgImage(agent.name ?? agentKey);
    }

    // If we have a Blob, we need to convert it to a data URL or serve it as an image
    if (agentMetadata.images.icon instanceof Blob) {
      const buffer = await agentMetadata.images.icon.arrayBuffer();
      const fontData = await interRegular;

      // Generate a custom OG image using the agent icon and information
      return new ImageResponse(
        (
          <div
            style={{
              display: "flex",
              fontSize: 60,
              color: "white",
              background: "#0f1729",
              width: "100%",
              height: "100%",
              padding: "50px 50px",
              textAlign: "center",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
              <Image
                src={`data:image/png;base64,${Buffer.from(buffer).toString("base64")}`}
                width={200}
                height={200}
                style={{
                  borderRadius: "10px",
                }}
                alt={agent.name ?? "Agent icon"}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <h1 style={{ fontSize: "60px", margin: 0 }}>
                  {agent.name ?? "Torus Agent"}
                </h1>
                <p style={{ fontSize: "28px", margin: 0, opacity: 0.8 }}>
                  Torus Network Agent
                </p>
              </div>
            </div>
            {agentMetadata.metadata.short_description && (
              <p
                style={{
                  fontSize: "24px",
                  margin: "0",
                  maxWidth: "800px",
                  opacity: 0.8,
                }}
              >
                {agentMetadata.metadata.short_description.substring(0, 200)}
                {agentMetadata.metadata.short_description.length > 200
                  ? "..."
                  : ""}
              </p>
            )}
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

    // Fallback to default OG image
    return generateDefaultOgImage(agent.name ?? agentKey);
  } catch (error) {
    console.error("Error generating OG image:", error);
    return NextResponse.json(
      { error: "Failed to generate OG image" },
      { status: 500 },
    );
  }
}

async function generateDefaultOgImage(name: string) {
  const fontData = await interRegular;

  // Generate a simple default OG image with the agent name
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          color: "white",
          background: "#0f1729",
          width: "100%",
          height: "100%",
          padding: "50px",
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <svg
          width="150"
          height="150"
          viewBox="0 0 200 200"
          fill="none"
          style={{ marginBottom: "30px" }}
        >
          <path
            d="M100 20C55.8172 20 20 55.8172 20 100C20 144.183 55.8172 180 100 180C144.183 180 180 144.183 180 100C180 55.8172 144.183 20 100 20ZM100 40C133.137 40 160 66.8629 160 100C160 133.137 133.137 160 100 160C66.8629 160 40 133.137 40 100C40 66.8629 66.8629 40 100 40Z"
            fill="#00AEEF"
          />
          <circle cx="100" cy="100" r="30" fill="#00AEEF" />
        </svg>
        <h1 style={{ fontSize: "60px" }}>
          {name.length > 20 ? `${name.substring(0, 20)}...` : name}
        </h1>
        <p style={{ fontSize: "30px", opacity: 0.8 }}>Torus Network Agent</p>
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
