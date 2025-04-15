import { fetchAgentMetadata } from "@torus-network/sdk";
import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import { Container } from "@torus-ts/ui/components/container";
import { Label } from "@torus-ts/ui/components/label";
import { MarkdownView } from "@torus-ts/ui/components/markdown-view";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpandedViewSocials } from "~/app/(expanded-pages)/agent/[slug]/components/expanded-view-socials";
import BlobImage from "~/app/_components/blob-image";
import { PenaltyList } from "~/app/_components/penalties-list";
import { api } from "~/trpc/server";
import { AgentInfoCard } from "./components/agent-info-card";
import { EditAgentButton } from "./components/edit-agent-button";

interface AgentPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AgentPage({ params }: Readonly<AgentPageProps>) {
  const { slug } = await params;

  if (!slug) return notFound();

  const agentKey = slug;

  const [mdl, penalties, computedAgentWeight] = await Promise.all([
    api.agent.byKeyLastBlock({ key: agentKey }),
    api.penalty.byAgentKey({ agentKey }),
    api.computedAgentWeight.all(),
  ]);

  if (!mdl?.metadataUri) return notFound();

  const { metadata, images } = await fetchAgentMetadata(mdl.metadataUri, {
    fetchImages: true,
  }).catch((e) => {
    console.error("Failed to fetch agent metadata:", e);
    return notFound();
  });

  const icon = images.icon;
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
              {icon && <BlobImage blob={icon} alt={`${mdl.name} icon`} />}
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
