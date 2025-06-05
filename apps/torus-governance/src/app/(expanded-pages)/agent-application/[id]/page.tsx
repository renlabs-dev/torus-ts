import {
  fetchAgentMetadata,
  fetchCustomMetadata,
  queryAgentApplicationById,
  setup,
} from "@torus-network/sdk";
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
import { tryAsync } from "@torus-network/torus-utils/try-catch";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata | null> {
  const { id } = await params;
  const baseUrl = env("BASE_URL");
  const applicationId = Number(id);
  const wsEndpoint = env("NEXT_PUBLIC_TORUS_RPC_URL");

  const [setupError, blockchainApi] = await tryAsync(setup(wsEndpoint));
  if (setupError) {
    console.error("Error setting up blockchain API:", setupError);
    return null;
  }

  const [appError, application] = await tryAsync(
    queryAgentApplicationById(blockchainApi, applicationId),
  );
  if (appError || !application) {
    console.error("Error querying agent application:", appError);
    return null;
  }

  const [agentError, agent] = await tryAsync(
    api.agent.byKeyLastBlock({ key: application.agentKey }),
  );
  if (agentError || !agent) {
    console.error("Error querying agent:", agentError);
    return null;
  }

  const customData = application.data
    ? ((
        await tryAsync(
          fetchCustomMetadata("application", application.id, application.data),
        )
      )[1] ?? (console.error("Failed to fetch application metadata:"), null))
    : null;

  const { title: applicationTitle, body: applicationBody } =
    handleCustomAgentApplications(application.id, customData);

  const agentMetadata = agent.metadataUri
    ? ((
        await tryAsync(
          fetchAgentMetadata(agent.metadataUri, { fetchImages: false }),
        )
      )[1]?.metadata ??
      (console.error("Failed to fetch agent metadata:"), null))
    : null;

  const title =
    applicationTitle ??
    `Agent Application: ${agent.name ?? agent.key} - Torus DAO`;
  const description =
    (
      applicationBody ??
      agentMetadata?.short_description ??
      `Agent application for ${agent.name ?? agent.key} on the Torus Network.`
    ).slice(0, 160) + ((applicationBody?.length ?? 0) > 160 ? "..." : "");

  // Use the agent key for OG image to avoid ID inconsistencies between environments
  // This will show agent info and agent icon
  const ogImagePath = `/api/og-image/${agent.key}`;

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
