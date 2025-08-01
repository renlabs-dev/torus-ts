import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { Suspense } from "react";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchAgentMetadata } from "@torus-network/sdk/metadata";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

import { AgentIcon } from "@torus-ts/ui/components/agent-card/agent-icon";
import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import { Container } from "@torus-ts/ui/components/container";
import { Label } from "@torus-ts/ui/components/label";
import { MarkdownView } from "@torus-ts/ui/components/markdown-view";
import { Skeleton } from "@torus-ts/ui/components/skeleton";

import { api } from "~/trpc/server";

import { PenaltyList } from "../../../_components/penalties-list";
import { AgentInfoCard } from "./components/agent-info-card";
import { ExpandedViewSocials } from "./components/expanded-view-socials";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [mdlError, mdl] = await tryAsync(
    api.agent.byKeyLastBlock({ key: slug }),
  );

  if (mdlError !== undefined) {
    return {}
  }
 
  const agentName = mdl?.name;
  
  return createSeoMetadata({
    title: `${agentName} - Agent Details | Torus Portal`,
    description: `View detailed information about ${agentName} on the Torus Network. Explore agent metadata, allocations, and performance metrics.`,
    keywords: ["agent details", "agent profile", "network participant", "agent information", "allocation details"],
    ogSiteName: "Torus Portal",
    canonical: `/root-allocator/agent/${slug}`,
    baseUrl: env("BASE_URL"),
  });
}

interface AgentPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AgentPage({ params }: Readonly<AgentPageProps>) {
  const { slug } = await params;

  if (!slug) return notFound();

  const agentKey = slug;

  const [penaltiesError, penalties] = await tryAsync(
    api.penalty.byAgentKey({ agentKey }),
  );
  if (penaltiesError !== undefined) {
    console.error("Error fetching agent penalties:", penaltiesError);
    notFound();
  }

  const [mdlError, mdl] = await tryAsync(
    api.agent.byKeyLastBlock({ key: agentKey }),
  );
  if (mdlError !== undefined) {
    console.error("Error fetching agent metadata:", mdlError);
    notFound();
  }

  if (!mdl?.metadataUri) return notFound();

  const [agentMetadataError, agentMetadata] = await tryAsync(
    fetchAgentMetadata(mdl.metadataUri, {
      fetchImages: true,
    }),
  );
  if (agentMetadataError !== undefined) {
    console.error("Error fetching agent metadata:", agentMetadataError);
    notFound();
  }

  const { metadata, images } = agentMetadata;

  // Convert Blob to data URL for client component
  let icon: string | undefined = undefined;
  if (images.icon) {
    const arrayBuffer = await images.icon.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = images.icon.type || "image/png";
    icon = `data:${mimeType};base64,${base64}`;
  }

  const [computedAgentError, computedAgentWeight] = await tryAsync(
    api.computedAgentWeight.all(),
  );
  if (computedAgentError !== undefined) {
    console.error("Error fetching computed agent weight:", computedAgentError);
    notFound();
  }

  const globalWeight = computedAgentWeight.find((d) => d.agentKey === agentKey);
  const networkAllocation = globalWeight
    ? (globalWeight.percComputedWeight * 100).toFixed(2)
    : "0";

  const showPenalties =
    mdl.weightFactor !== null && mdl.weightFactor > 0 && penalties.length > 0;

  return (
    <Container>
      <div className="mx-auto pb-16 text-white">
        <Button
          asChild
          variant="link"
          className="flex w-fit items-center gap-1.5 p-0"
        >
          <Link
            href="/root-allocator"
            className="mb-4 flex items-center text-white transition duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            Go back to agents list
          </Link>
        </Button>

        <div className="mb-12 flex flex-col gap-6 md:flex-row">
          <div className="mb-12 flex flex-col gap-6 md:w-2/3">
            <Card className="mb-6 flex flex-col gap-6 md:flex-row">
              <Suspense
                fallback={
                  <Skeleton className="aspect-square h-48 w-48 rounded-sm" />
                }
              >
                <AgentIcon alt={`${mdl.name} icon`} icon={icon} />
              </Suspense>
              <div className="flex w-fit flex-col gap-6 p-6 md:p-0 md:pt-6 md:pr-6">
                <h1 className="text-start text-3xl font-semibold">
                  {mdl.name}
                </h1>
                <p className="text-card-foreground word-break-break-word">
                  {metadata.short_description}
                </p>
              </div>
            </Card>

            <MarkdownView source={metadata.description} />
          </div>

          <div className="flex flex-col gap-6 md:w-1/3">
            <AgentInfoCard agent={mdl} />

            <Card className="flex items-center justify-between p-6">
              <p>Agent Links:</p>
              <ExpandedViewSocials
                socials={metadata.socials}
                website={metadata.website}
              />
            </Card>

            <Card className="p-6">
              <Label className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
                <span className="text-cyan-500">{networkAllocation}%</span>{" "}
                Current Network Allocation
              </Label>
              <div className="rounded-radius bg-primary-foreground my-2 w-full">
                <div
                  className="rounded-radius bg-gradient-to-r from-blue-700 to-cyan-500 py-2"
                  style={{ width: `${networkAllocation}%` }}
                />
              </div>
            </Card>

            {showPenalties && <PenaltyList penalties={penalties} />}
          </div>
        </div>
      </div>
    </Container>
  );
}
