import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe } from "lucide-react";

import { formatToken, smallAddress } from "@torus-ts/utils/subspace";

import type { Subnet } from "~/utils/types";
import { api } from "~/trpc/server";

const DIGITS = /^\d+$/;

interface Params {
  params: {
    slug: string[];
  };
}

export default async function SubnetPage({ params }: Params) {
  const { slug } = params;

  if (slug.length !== 1) {
    notFound();
  }

  const netuid_ = slug[0];
  if (!DIGITS.test(String(netuid_))) {
    notFound();
  }
  const netuid = Number(netuid_);

  const subnet = await api.subnet.byNetuidLastBlock({ netuid: netuid });

  if (!subnet) {
    notFound();
  }

  return (
    <div className="container mx-auto min-h-[calc(100vh-169px)] w-full p-4 pb-28 text-white">
      <div className="flex w-full flex-col items-center justify-between gap-6 md:my-16 md:flex-row md:gap-0">
        <div className="z-10 flex gap-3 md:absolute">
          <Link
            href="/subnets"
            className="flex animate-fade-left items-center gap-1 border border-white/20 bg-[#898989]/5 p-2 pr-3 text-white backdrop-blur-md transition duration-200 hover:border-cyan-500 hover:bg-cyan-500/10"
          >
            <ArrowLeft className="h-5 w-5 text-cyan-500" />
            Go back to Subnets list
          </Link>
          {subnet.subnetMetadata && (
            <Link
              target="_blank"
              href={subnet.subnetMetadata}
              className="flex animate-fade-left items-center gap-1 border border-white/20 bg-[#898989]/5 p-2 pr-3 text-white backdrop-blur-md transition duration-200 hover:border-cyan-500 hover:bg-cyan-500/10"
            >
              <Globe className="h-5 w-5 text-cyan-500" />
              View More
            </Link>
          )}
        </div>
        <h1 className="flex-grow animate-fade-right text-center font-semibold text-gray-300">
          <span className="text-3xl font-semibold text-cyan-500">
            {subnet.name}
          </span>{" "}
          / NETUID: {subnet.netuid}
        </h1>
      </div>
      <SubnetDataGrid subnet={subnet} />
    </div>
  );
}

function SubnetDataGrid({ subnet }: { subnet: Subnet }) {
  const dataGroups = [
    {
      title: "General Information",
      fields: [
        { label: "Netuid", value: subnet.netuid },
        { label: "Name", value: subnet.name },
        { label: "Tempo", value: subnet.tempo },
        { label: "Founder", value: smallAddress(subnet.founder) },
      ],
    },
    {
      title: "Weight Configuration",
      fields: [
        { label: "Min Allowed Weights", value: subnet.minAllowedWeights },
        { label: "Max Allowed Weights", value: subnet.maxAllowedWeights },
        { label: "Max Allowed UIDs", value: subnet.maxAllowedUids },
        { label: "Max Weight Age", value: subnet.maxWeightAge },
        { label: "Trust Ratio", value: subnet.trustRatio },
        {
          label: "Max Set Weight Calls/Epoch",
          value: subnet.maximumSetWeightCallsPerEpoch,
        },
      ],
    },
    {
      title: "Economic Parameters",
      fields: [
        { label: "Founder Share", value: subnet.founderShare },
        { label: "Incentive Ratio", value: subnet.incentiveRatio },
        {
          label: "Subnet Emission",
          value: `${formatToken(BigInt(subnet.subnetEmission))} COMAI`,
        },
        { label: "Bonds MA", value: subnet.bondsMa },
        { label: "Immunity Period", value: subnet.immunityPeriod },
      ],
    },
    {
      title: "Governance Configuration",
      fields: [
        {
          label: "Proposal Cost",
          value: `${formatToken(BigInt(subnet.proposalCost))} COMAI`,
        },
        { label: "Proposal Expiration", value: subnet.proposalExpiration },
        { label: "Vote Mode", value: subnet.voteMode },
        {
          label: "Proposal Reward Treasury Allocation",
          value: subnet.proposalRewardTreasuryAllocation,
        },
        {
          label: "Max Proposal Reward Treasury Allocation",
          value: `${formatToken(BigInt(subnet.maxProposalRewardTreasuryAllocation))} COMAI`,
        },
        {
          label: "Proposal Reward Interval",
          value: subnet.proposalRewardInterval,
        },
      ],
    },
    {
      title: "Burn Configuration",
      fields: [
        {
          label: "Min Burn",
          value: `${formatToken(BigInt(subnet.minBurn))} COMAI`,
        },
        {
          label: "Max Burn",
          value: `${formatToken(BigInt(subnet.maxBurn))} COMAI`,
        },
        {
          label: "Adjustment Alpha",
          value: subnet.adjustmentAlpha,
        },
        {
          label: "Target Registrations Interval",
          value: subnet.targetRegistrationsInterval,
        },
        {
          label: "Target Registrations Per Interval",
          value: subnet.targetRegistrationsPerInterval,
        },
        {
          label: "Max Registrations Per Interval",
          value: subnet.maxRegistrationsPerInterval,
        },
      ],
    },
    {
      title: "Additional Information",
      fields: [
        { label: "At Block", value: subnet.atBlock },
        {
          label: "Min Validator Stake",
          value: `${formatToken(subnet.minValidatorStake ?? 0)} COMAI`,
        },
        { label: "Max Allowed Validators", value: subnet.maxAllowedValidators },
      ],
    },
  ];

  return (
    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
      {dataGroups.map((group, index) => (
        <div
          key={index}
          className="border border-white/20 bg-[#898989]/5 p-6 backdrop-blur-md"
        >
          <h3 className="mb-4 text-lg font-semibold">{group.title}</h3>
          <div className="grid gap-2">
            {group.fields.map((field, fieldIndex) => (
              <div key={fieldIndex} className="flex justify-between">
                <span className="text-white/70">{field.label}:</span>
                <span className="font-mono">{field.value ?? "N/A"}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
