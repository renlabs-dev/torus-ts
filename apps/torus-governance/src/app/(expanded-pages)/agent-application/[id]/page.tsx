import { fetchAgentMetadata } from "@torus-network/sdk";
import { Button } from "@torus-ts/ui/components/button";
import { Container } from "@torus-ts/ui/components/container";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { env } from "~/env";
import { api } from "~/trpc/server";
import { AgentApplicationExpandedView } from "./_components/agent-application-expanded-view";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const baseUrl = env("BASE_URL");

  const agent = await api.agent.byId({ id: +id });

  if (!agent) {
    notFound();
  }

  const { metadata, images } = await fetchAgentMetadata(
    agent.metadataUri ?? "",
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

export default async function AgentApplicationView({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  if (!id) {
    return <div>Not Found</div>;
  }

  return (
    <Container>
      <div className="mx-auto flex w-full max-w-screen-xl flex-col pb-20">
        <Button
          asChild
          variant="link"
          className="mb-6 flex w-fit items-center gap-1.5 p-0"
        >
          <Link
            href="/whitelist-applications"
            className="animate-fade-left flex items-center text-white transition duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            Go back to agents/modules list
          </Link>
        </Button>

        <div
          className="flex h-full w-full flex-col justify-between divide-gray-500 text-white
            lg:flex-row"
        >
          <AgentApplicationExpandedView paramId={Number(id)} />
        </div>
      </div>
    </Container>
  );
}
