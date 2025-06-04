import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import type { Metadata } from "next";
import { fetchAgentMetadata } from "@torus-network/sdk";
import { api } from "~/trpc/server";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseInt(params.id, 10);
  const baseUrl = env("BASE_URL");

  const agent = await api.agent.byId({ id });

  const { metadata, images } = await fetchAgentMetadata(
    agent?.metadataUri ?? "",
    {
      fetchImages: true,
    },
  );

  let ogImagePath = `/api/og-image/agent-application/${id}`;

  if (images.icon) {
    try {
      const iconBlob = new Blob([images.icon], { type: "image/png" });
      ogImagePath = URL.createObjectURL(iconBlob);
    } catch (error) {
      console.error("Failed to convert icon blob to URL:", error);
    }
  }

  if (!agent) {
    return createSeoMetadata({
      title: "Agent Application Not Found - Torus DAO",
      description:
        "The requested agent application could not be found in the Torus Network DAO.",
      keywords: [
        "agent application not found",
        "torus dao",
        "whitelist application",
      ],
      baseUrl,
      canonical: `/agent-application/${id}`,
      ogImagePath: `/api/og-image/agent-application/${id}`,
    });
  }

  const title = `Agent Application: ${agent.name ?? agent.key} - Torus DAO`;
  let description =
    metadata.short_description ||
    `Agent application for ${agent.name} on the Torus Network.`;
  if (description.length > 160) {
    description = description.slice(0, 157) + "...";
  }

  return createSeoMetadata({
    title,
    description,
    keywords: [
      "torus agent",
      "agent application",
      "whitelist application",
      "agent onboarding",
      "torus dao",
      agent.name
        ? agent.name
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .join(" ")
        : "agent whitelist",
    ],
    baseUrl,
    canonical: `/agent-application/${id}`,
    ogImagePath,
  });
}
