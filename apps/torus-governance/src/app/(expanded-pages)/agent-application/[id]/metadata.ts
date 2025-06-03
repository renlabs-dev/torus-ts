import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { api } from "~/trpc/server";
import type { Metadata } from "next";

interface Props {
  params: { id: string };
}

export async function generateMetadata(
  { params }: Props,
): Promise<Metadata> {
  const id = parseInt(params.id, 10);
  const baseUrl = env("BASE_URL");
  const _ogImageUrl = `${baseUrl}/api/og-image/agent-application/${id}`;
  
  try {
    // Fetch the agent application details
    const application = await api.agentApplication.getAgentApplicationById({ id });
    if (!application) {
      throw new Error('Application not found');
    }
    
    if (!application) {
      return createSeoMetadata({
        title: "Agent Application Not Found - Torus DAO",
        description: "The requested agent application could not be found in the Torus Network DAO.",
        keywords: ["agent application not found", "torus dao", "whitelist application"],
        baseUrl: baseUrl,
        canonical: `/agent-application/${id}`,
        ogImagePath: `/api/og-image/agent-application/${id}`,
      });
    }
    
    // Create dynamic title based on agent name or address
    const title = `Agent Application: ${application.name ?? application.agentId?.substring(0, 10)} - Torus DAO`;
    
    // Create description from application details
    // Limit description to ~160 characters
    let description = application.description ?? `Agent application for ${application.name ?? application.agentId?.substring(0, 10)} on the Torus Network.`;
    if (description && description.length > 160) {
      description = description.substring(0, 157) + "...";
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
        application.name?.toLowerCase().replace(/[^\w\s]/gi, '').split(' ').join(' ') ?? "agent whitelist",
      ],
      baseUrl: baseUrl,
      canonical: `/agent-application/${id}`,
      ogImagePath: `/api/og-image/agent-application/${id}`,
    });
  } catch (error: unknown) {
    // Fallback metadata if the API call fails
    return createSeoMetadata({
      title: "Agent Application Details - Torus DAO",
      description: "View details and vote on this agent whitelist application for the Torus Network.",
      keywords: ["torus agent", "agent application", "whitelist application", "agent onboarding"],
      baseUrl: baseUrl,
      canonical: `/agent-application/${id}`,
      ogImagePath: `/api/og-image/agent-application/${id}`,
    });
  }
}