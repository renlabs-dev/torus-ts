"use client";

import { Card } from "@torus-ts/ui/components/card";
import { Label } from "@torus-ts/ui/components/label";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

export default function DashboardInfoCards() {
  const { whitelist, agents } = useGovernance();
  const { data: penalties } = api.penalty.all.useQuery();
  const { data: cadreCandidate } = api.cadreCandidate.allWithDiscord.useQuery();

  const agentsRegistered = agents.data?.size;
  const agentsWhitelisted = whitelist.data?.length;
  const penaltiesCount = penalties?.length;
  const pendingDaoApplications = cadreCandidate?.filter(
    (candidate) => candidate.candidacyStatus === "PENDING",
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <InfoCard title="Agents Registered" value={agentsRegistered} />
      <InfoCard title="Agents Whitelisted" value={agentsWhitelisted} />
      <InfoCard title="Penalties Applied" value={penaltiesCount} />
      <InfoCard title="DAO Applications" value={pendingDaoApplications} />
    </div>
  );
}

interface InfoCardProps {
  title: string;
  value: number | undefined;
}

function InfoCard({ title, value }: InfoCardProps) {
  return (
    <Card className="flex flex-col items-start justify-center p-5 gap-2">
      <Label className="text-sm text-muted-foreground font-bold">{title}</Label>
      <Label className="text-2xl font-black">
        {value ?? <span className="animate-pulse">0</span>}
      </Label>
    </Card>
  );
}
