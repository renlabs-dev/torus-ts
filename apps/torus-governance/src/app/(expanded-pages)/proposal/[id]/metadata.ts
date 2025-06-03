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
  const _ogImageUrl = `${baseUrl}/api/og-image/proposal/${id}`;
  
  try {
    // Fetch the proposal details
    const proposal = await api.proposal.getProposalById({ id });
    
    if (!proposal) {
      return createSeoMetadata({
        title: "Proposal Not Found - Torus DAO",
        description: "The requested proposal could not be found in the Torus Network DAO.",
        keywords: ["proposal not found", "torus dao", "governance proposal"],
        baseUrl: baseUrl,
        canonical: `/proposal/${id}`,
        ogImagePath: `/api/og-image/proposal/${id}`,
      });
    }
    
    // Create dynamic title from proposal title
    const title = `${proposal.title ?? ''} - Torus DAO Proposal`;
    
    // Create description from proposal summary or description
    // Limit description to ~160 characters
    let description = proposal.summary ?? proposal.description ?? "";
    if (description && description.length > 160) {
      description = description.substring(0, 157) + "...";
    }
    
    return createSeoMetadata({
      title,
      description,
      keywords: [
        "torus proposal",
        "governance voting",
        "dao proposal",
        proposal.title ? proposal.title.toLowerCase().replace(/[^\w\s]/gi, '').split(' ').slice(0, 3).join(' ') : 'governance',
      ],
      baseUrl: baseUrl,
      canonical: `/proposal/${id}`,
      ogImagePath: `/api/og-image/proposal/${id}`,
    });
  } catch (error: unknown) {
    // Fallback metadata if the API call fails
    return createSeoMetadata({
      title: "Proposal Details - Torus DAO",
      description: "View details and vote on this governance proposal for the Torus Network.",
      keywords: ["torus proposal", "governance voting", "dao proposal"],
      baseUrl: baseUrl,
      canonical: `/proposal/${id}`,
      ogImagePath: `/api/og-image/proposal/${id}`,
    });
  }
}