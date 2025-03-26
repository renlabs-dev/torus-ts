import { fetchAgentMetadata } from "@torus-network/sdk";
import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import { Container } from "@torus-ts/ui/components/container";
import { Label } from "@torus-ts/ui/components/label";
import { MarkdownView } from "@torus-ts/ui/components/markdown-view";
import BlobImage from "~/app/_components/blob-image";
import { PenaltyList } from "~/app/_components/penalties-list";
import { ExpandedViewSocials } from "~/app/(expanded-pages)/agent/[slug]/components/expanded-view-socials";
import { api } from "~/trpc/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentInfoCard } from "./components/agent-info-card";

export default async function AgentPage({
  params,
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;

  if (!slug) {
    return <div>Not Found</div>;
  }

  const agentKey = slug;

  const mdl = await api.agent.byKeyLastBlock({ key: agentKey });
  const penalties = await api.penalty.byAgentKey({ agentKey });

  if (!mdl) {
    notFound();
  }

  if (!mdl.metadataUri) {
    notFound();
  }

  let metadata;
  let images;

  try {
    const r = await fetchAgentMetadata(mdl.metadataUri, {
      fetchImages: true,
    });
    metadata = r.metadata;
    images = r.images;
  } catch (e) {
    console.error(e);
    notFound();
  }

  // Blob URL for the icon
  const icon = images.icon;

  const computedAgentWeight = await api.computedAgentWeight.all();

  const globalWeight = computedAgentWeight.find((d) => d.agentKey === agentKey);

  return (
    <Container>
      <div className="mx-auto pb-16 text-white">
        <Button
          asChild
          variant="link"
          className="flex w-fit items-center gap-1.5 p-0"
        >
          <Link
            href="/"
            className="mb-4 flex items-center text-white transition duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            Go back to agents list
          </Link>
        </Button>

        <div className="mb-12 flex flex-col gap-6 md:flex-row">
          <div className="mb-12 flex flex-col gap-6 md:w-2/3">
            <Card className="mb-6 flex flex-col gap-6 md:flex-row">
              {icon && <BlobImage blob={icon} alt="My Blob Image" />}
              <div className="flex w-fit flex-col gap-6 p-6 md:p-0 md:pt-6">
                <h1 className="text-start text-3xl font-semibold">
                  {mdl.name}
                </h1>

                <p className="text-card-foreground">
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
                <span className="text-cyan-500">
                  {globalWeight
                    ? (globalWeight.percComputedWeight * 100).toFixed(2)
                    : 0}
                  %
                </span>{" "}
                Current Network Allocation
              </Label>
              <div className="rounded-radius bg-primary-foreground my-2 w-full">
                <div
                  className="rounded-radius bg-gradient-to-r from-blue-700 to-cyan-500 py-2"
                  style={{
                    width: `${globalWeight ? (globalWeight.percComputedWeight * 100).toFixed(2) : 0}%`,
                  }}
                />
              </div>
            </Card>

            {mdl.weightFactor !== null &&
              mdl.weightFactor > 0 &&
              penalties.length > 0 && <PenaltyList penalties={penalties} />}
          </div>
        </div>
      </div>
    </Container>
  );
}
