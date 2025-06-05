import { fetchAgentMetadata, fetchCustomMetadata, queryAgentApplications, setup } from "@torus-network/sdk";
import { Button } from "@torus-ts/ui/components/button";
import { Container } from "@torus-ts/ui/components/container";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { env } from "~/env";
import { api } from "~/trpc/server";
import { handleCustomAgentApplications } from "../../../../utils";
import { AgentApplicationExpandedView } from "./_components/agent-application-expanded-view";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const baseUrl = env("BASE_URL");

  try {
    // Get applications using SDK
    const applicationId = Number(id);
    
    // Setup API connection to fetch agent applications
    const wsEndpoint = env("NEXT_PUBLIC_TORUS_RPC_URL");
    const blockchainApi = await setup(wsEndpoint);
    const applications = await queryAgentApplications(blockchainApi);
    const application = applications.find((app) => app.id === applicationId);

    if (!application) {
      return createSeoMetadata({
        title: "Agent Application Not Found - Torus DAO",
        description: "The requested agent application could not be found.",
        keywords: ["torus dao", "agent application", "not found"],
        baseUrl,
        canonical: `/agent-application/${id}`,
      });
    }

    // Get the agent details using tRPC
    const agent = await api.agent.byKeyLastBlock({ key: application.agentKey });

    if (!agent) {
      return createSeoMetadata({
        title: "Agent Not Found - Torus DAO",
        description: "The agent for this application could not be found.",
        keywords: ["torus dao", "agent application", "agent not found"],
        baseUrl,
        canonical: `/agent-application/${id}`,
      });
    }

    // Fetch custom metadata for the application
    let customData = null;
    try {
      if (application.data) {
        const metadataResult = await fetchCustomMetadata(
          "application",
          application.id,
          application.data,
        );
        customData = metadataResult;
      }
    } catch (error) {
      console.error("Failed to fetch application metadata:", error);
    }

    // Use the same utility function as the component to get title and body
    const { title: applicationTitle, body: applicationBody } = handleCustomAgentApplications(
      application.id,
      customData,
    );

    // Fetch agent metadata for icon and description
    let agentMetadata = null;
    let images = null;
    try {
      if (agent.metadataUri) {
        const result = await fetchAgentMetadata(agent.metadataUri, {
          fetchImages: true,
        });
        agentMetadata = result.metadata;
        images = result.images;
      }
    } catch (error) {
      console.error("Failed to fetch agent metadata:", error);
    }

    let ogImagePath = `/api/og-image/agent-application/${id}`;

    if (images?.icon) {
      try {
        const iconBlob = new Blob([images.icon], { type: "image/png" });
        ogImagePath = URL.createObjectURL(iconBlob);
      } catch (error) {
        console.error("Failed to convert icon blob to URL:", error);
      }
    }

    const title = applicationTitle ?? `Agent Application: ${agent.name ?? agent.key} - Torus DAO`;
    let description = applicationBody ?? 
      agentMetadata?.short_description ??
      `Agent application for ${agent.name ?? agent.key} on the Torus Network.`;
    
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
  } catch (error) {
    console.error("Error generating metadata:", error);
    return createSeoMetadata({
      title: "Agent Application - Torus DAO",
      description: "View agent application on the Torus Network.",
      keywords: ["torus dao", "agent application"],
      baseUrl,
      canonical: `/agent-application/${id}`,
    });
  }
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
