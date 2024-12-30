import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { fetchCustomMetadata } from "@torus-ts/subspace";
import { Button } from "@torus-ts/ui";

import { ReportAgent } from "~/app/components/report-agent";
import { api } from "~/trpc/server";
import { ExpandedViewContent } from "~/app/components/expanded-view-content";
import { AgentDataGrid } from "~/app/components/agent-datagrid";

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

  if (slug.length !== 1) {
    notFound();
  }

  const agentKey = slug[0];

  if (!agentKey) {
    notFound();
  }
  const mdl = await api.agent.byKeyLastBlock({ key: agentKey });

  console.log(mdl);
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
    <div className="container mx-auto min-h-[calc(100vh-169px)] py-4 text-white">
      <Button
        asChild
        variant="link"
        className="flex w-fit items-center gap-1 px-0"
      >
        <Link
          href="/?view=agents"
          className="mt-8 flex animate-fade-left items-center text-white transition duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          Go back to agents list
        </Link>
      </Button>

      <div className="my-8 flex w-full items-center justify-between">
        <h1 className="flex-grow animate-fade-right text-start text-3xl font-semibold">
          {mdl.name}
        </h1>
        <div className="">
          <ReportAgent agentKey={mdl.key ?? ""} />
        </div>
      </div>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="mb-12 flex w-2/3 animate-fade-down flex-col gap-6 animate-delay-500">
          <ExpandedViewContent content={description} />
        </div>
        <div className="flex w-1/3 animate-fade-down flex-col gap-6 animate-delay-500">
          <AgentDataGrid agent={mdl} />
        </div>
      </div>
    </div>
  );
}
