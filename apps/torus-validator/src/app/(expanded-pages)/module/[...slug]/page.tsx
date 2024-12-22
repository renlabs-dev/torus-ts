import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { fetchCustomMetadata } from "@torus-ts/subspace";
import { Card } from "@torus-ts/ui";
import { MarkdownView } from "@torus-ts/ui/markdown-view";
import { formatToken } from "@torus-ts/utils/subspace";

import type { Agent } from "~/utils/types";
import { ReportAgent } from "~/app/components/report-agent";
import { api } from "~/trpc/server";

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
    <div className="container mx-auto min-h-[calc(100vh-169px)] p-4 pb-28 text-white">
      <div className="my-16 flex w-full items-center justify-between">
        <Link
          href="/agents"
          className="absolute z-10 flex animate-fade-left items-center gap-1 border border-white/20 bg-[#898989]/5 p-2 pr-3 text-white backdrop-blur-md transition duration-200 hover:border-green-500 hover:bg-green-500/10"
        >
          <ArrowLeft className="h-5 w-5 text-green-500" />
          Go back to agents list
        </Link>
        <h1 className="flex-grow animate-fade-right text-center text-3xl font-semibold">
          {mdl.name}
        </h1>
        <div className="">
          <ReportAgent agentKey={mdl.key ?? ""} />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-6 md:flex-row">
        <div className="animate-fade-down animate-delay-300 md:w-[60%] xl:w-[70%]">
          <Card className="p-8">
            <h2 className="mb-4 text-xl font-semibold">Description</h2>
            <MarkdownView source={description} />
          </Card>
        </div>
        <div className="flex animate-fade-down flex-col gap-6 animate-delay-500 md:w-[40%] xl:w-[30%]">
          <AgentDataGrid agent={mdl} />
        </div>
      </div>
    </div>
  );
}

function AgentDataGrid({ agent }: { agent: Agent }) {
  const dataGroups = [
    {
      title: "General Information",
      fields: [
        { label: "Agent Key", value: agent.key },
        { label: "Name", value: agent.name ?? "N/A" },
        { label: "At Block", value: agent.atBlock },
        {
          label: "Registration Block",
          value: agent.registrationBlock ?? "N/A",
        },
      ],
    },
    {
      title: "Economic Parameters",
      fields: [
        { label: "Emission", value: formatToken(agent.totalStakers ?? 0) },
        // { label: "Incentive", value: formatToken(agent.incentive ?? 0) },
        // { label: "Dividend", value: formatToken(agent.dividend ?? 0) },
        // { label: "Delegation Fee", value: `${agent.delegationFee ?? 0}%` },
      ],
    },
    {
      title: "Staking Information",
      fields: [
        { label: "Total Staked", value: formatToken(agent.totalStaked ?? 0) },
        { label: "Total Stakers", value: agent.totalStakers ?? 0 },
        // {
        //   label: "Total Rewards",
        //   value: formatToken(agent.totalRewards ?? 0),
        // },
      ],
    },
  ];

  return (
    <div className="grid gap-6">
      {dataGroups.map((group, index) => (
        <Card key={index} className="p-6">
          <h3 className="mb-4 text-lg font-semibold">{group.title}</h3>
          <div className="grid gap-2">
            {group.fields.map((field, fieldIndex) => (
              <div key={fieldIndex} className="flex justify-between">
                <span className="text-white/70">{field.label}:</span>
                <span className="font-mono">{field.value}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
