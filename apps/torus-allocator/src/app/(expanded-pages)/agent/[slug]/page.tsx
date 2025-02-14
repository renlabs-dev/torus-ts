import { fetchAgentMetadata } from "@torus-ts/subspace";
import { Button, Card, Container, Label } from "@torus-ts/ui";
import { MarkdownView } from "@torus-ts/ui/markdown-view";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentInfoCard } from "~/app/components/agent-info-card";
import BlobImage from "~/app/components/blob-image";
import { DelegateModuleWeight } from "~/app/components/delegate-module-weight";
import { ExpandedViewSocials } from "~/app/components/expanded-view-socials";
import { PenaltyList } from "~/app/components/penalties-list";
import { api } from "~/trpc/server";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<JSX.Element> {
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
            className="mb-4 flex animate-fade-left items-center text-white transition duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            Go back to agents list
          </Link>
        </Button>

        <div className="mb-12 flex flex-col gap-6 md:flex-row">
          <div className="mb-12 flex animate-fade-down flex-col gap-6 animate-delay-500 md:w-2/3">
            <Card className="mb-6 flex flex-col gap-6 md:flex-row">
              {icon && <BlobImage blob={icon} alt="My Blob Image" />}
              <div className="flex w-fit flex-col gap-6 p-6 md:p-0 md:pt-6">
                <h1 className="animate-fade-right text-start text-3xl font-semibold">
                  {mdl.name}
                </h1>

                <p className="text-card-foreground">
                  {metadata.short_description}
                </p>
              </div>
            </Card>

            <MarkdownView source={metadata.description} />
          </div>
          <div className="flex animate-fade-down flex-col gap-6 animate-delay-500 md:w-1/3">
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
              <div className="rounded-radius my-2 w-full bg-primary-foreground">
                <div
                  className="rounded-radius bg-gradient-to-r from-blue-700 to-cyan-500 py-2"
                  style={{
                    width: `${globalWeight ? (globalWeight.percComputedWeight * 100).toFixed(2) : 0}%`,
                  }}
                />
              </div>
            </Card>
            <div className="relative z-30 flex w-full flex-col gap-2 md:flex-row">
              <DelegateModuleWeight
                id={mdl.id}
                name={mdl.name ?? "Missing Agent Name"}
                agentKey={mdl.key}
                metadataUri={mdl.metadataUri}
                registrationBlock={mdl.registrationBlock}
                className="w-full"
              />
            </div>
            {mdl.weightFactor !== null &&
              mdl.weightFactor > 0 &&
              penalties.length > 0 && <PenaltyList penalties={penalties} />}
          </div>
        </div>
      </div>
    </Container>
  );
}
