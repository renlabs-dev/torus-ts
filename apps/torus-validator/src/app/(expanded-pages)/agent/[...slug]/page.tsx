import { AgentInfoCard } from "~/app/components/agent-info-card";
import { api } from "~/trpc/server";
import { ArrowLeft } from "lucide-react";
import { Button } from "@torus-ts/ui";
import { ExpandedViewContent } from "~/app/components/expanded-view-content";
import { fetchCustomMetadata } from "@torus-ts/subspace";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Params {
  params: {
    slug: string[];
  };
}

interface CustomMetadata {
  Ok?: {
    title?: string;
    body?: string;
  };
}

export default async function AgentPage({ params }: Params) {
  const { slug } = params;

  if (slug.length !== 1 || !slug[0]) {
    notFound();
  }

  const agentKey = slug[0];

  const mdl = await api.agent.byKeyLastBlock({ key: agentKey });

  if (!mdl) {
    notFound();
  }

  const metadata = (await fetchCustomMetadata(
    "proposal",
    mdl.id,
    mdl.metadataUri ?? "",
  )) as CustomMetadata;

  // limited to 140 characters
  const description = metadata.Ok?.body ?? "This agent has no custom metadata";

  return (
    <div className="mx-auto min-h-[calc(100vh-169px)] pt-12 text-white">
      <Button
        asChild
        variant="link"
        className="flex w-fit items-center gap-1.5 p-0"
      >
        <Link
          href="/?view=agents"
          className="flex animate-fade-left items-center text-white transition duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          Go back to agents list
        </Link>
      </Button>

      <div className="mb-6 mt-10 flex w-full">
        <h1 className="flex-grow animate-fade-right text-start text-3xl font-semibold">
          {mdl.name}
        </h1>
      </div>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="mb-12 flex animate-fade-down flex-col gap-6 animate-delay-500 md:w-2/3">
          <ExpandedViewContent content={description} />
        </div>
        <div className="flex animate-fade-down flex-col gap-6 animate-delay-500 md:w-1/3">
          <AgentInfoCard agent={mdl} />
        </div>
      </div>
    </div>
  );
}
