"use client";

import { ListContainer } from "./container-list";
import type { AppRouter } from "@torus-ts/api";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import { links } from "@torus-ts/ui/lib/data";
import { smallAddress } from "@torus-ts/utils/subspace";
import type { inferProcedureOutput } from "@trpc/server";
import { ArrowRight, Coins } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useGovernance } from "~/context/governance-provider";
import { env } from "~/env";
import { api } from "~/trpc/react";

const apiLinks = links(env("NEXT_PUBLIC_TORUS_CHAIN_ENV"));

const EmissionHealthFactorBadge = ({
  penaltyFactor,
}: {
  penaltyFactor: number;
}) => {
  const emissionHealthFactor = 100 - penaltyFactor;

  const badgeColorClassName =
    emissionHealthFactor === 100
      ? "bg-green-500/10 text-green-500 hover:bg-green-500/10"
      : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10";

  return (
    <Badge
      variant="solid"
      className={`flex items-center gap-1 ${badgeColorClassName}`}
    >
      <Coins size={12} /> {emissionHealthFactor.toFixed(0)}%
    </Badge>
  );
};

const handleStatusColors = (executed: boolean) =>
  executed
    ? "text-red-400 ring-red-400/20"
    : "text-yellow-400 ring-yellow-400/20";

type AgentWithAggregatedPenalties = NonNullable<
  inferProcedureOutput<AppRouter["agent"]["allWithAggregatedPenalties"]>
>;

type PenaltyList = AgentWithAggregatedPenalties[number]["penalties"];

interface DialogPenaltiesState {
  penalties: PenaltyList;
  agentName: string;
}

function processAgent({
  agent,
  search,
}: {
  agent: AgentWithAggregatedPenalties[number];
  search: string | null;
}): AgentWithAggregatedPenalties[number] | null {
  if (!search) {
    return agent;
  }

  const searchLower = search.toLocaleLowerCase();
  const agentKeyLower = agent.key.toLocaleLowerCase();
  const agentNameLower = (agent.name ?? "").toLocaleLowerCase();

  if (
    !agentNameLower.includes(searchLower) &&
    !agentKeyLower.includes(searchLower)
  ) {
    return null;
  }

  return agent;
}

export const ListAgents = () => {
  const { cadreList } = useGovernance();
  const { data: cadreListData } = cadreList;
  const { data: agentsWithPenalties, isFetching } =
    api.agent.allWithAggregatedPenalties.useQuery();

  const penaltyThreshold = Math.sqrt(cadreListData?.length ?? 0) + 1;

  const [penaltiesDialog, setPenaltiesDialog] =
    useState<DialogPenaltiesState | null>(null);
  const hiddenTriggerRef = useRef<HTMLButtonElement>(null);

  const searchParams = useSearchParams();

  const content = useMemo(() => {
    if (!agentsWithPenalties) return [];

    const search = searchParams.get("search")?.toLocaleLowerCase() ?? null;

    const filteredAgents = agentsWithPenalties
      .map((agent) => processAgent({ agent, search }))
      .filter(
        (agent): agent is AgentWithAggregatedPenalties[number] =>
          agent !== null,
      );

    return filteredAgents;
  }, [agentsWithPenalties, searchParams]);

  if (isFetching) return <p>Loading...</p>;
  if (!agentsWithPenalties) return <p>No agents found.</p>;
  if (agentsWithPenalties.length === 0 || content.length === 0)
    return <p>No agents found</p>;

  return (
    <>
      <ListContainer>
        {content.map((agent) => (
          <AgentPenaltiesCard
            key={agent.key}
            content={agent}
            penaltyThreshold={penaltyThreshold}
            setPenaltiesDialog={(content) => {
              setPenaltiesDialog(content);
              hiddenTriggerRef.current?.click();
            }}
          />
        ))}
      </ListContainer>
      <Dialog>
        <DialogTrigger ref={hiddenTriggerRef} className="hidden" />
        <DialogContent className="w-full max-w-[80vw]">
          <DialogTitle>
            Penalties
            {penaltiesDialog?.agentName && ` for ${penaltiesDialog.agentName}`}
          </DialogTitle>
          <PenaltiesList penalties={penaltiesDialog?.penalties} />
        </DialogContent>
      </Dialog>
    </>
  );
};

const PenaltyLabel = ({
  penaltyLength,
  penaltyFactor,
  penaltyThreshold,
}: {
  penaltyLength: number;
  penaltyFactor: number;
  penaltyThreshold: number;
}) => {
  if (!penaltyLength) return null;

  if (penaltyLength >= penaltyThreshold) {
    return (
      <span className="text-xs text-red-400">
        Penalties: {penaltyThreshold} | Consensus: {penaltyFactor}%
      </span>
    );
  }

  return (
    <span className="text-muted-foreground text-xs">
      Penalties {penaltyLength}/{penaltyThreshold}
    </span>
  );
};

const AgentPenaltiesCard = (props: {
  content: AgentWithAggregatedPenalties[number];
  setPenaltiesDialog: (content: DialogPenaltiesState) => void;
  penaltyThreshold: number;
}) => {
  const { content, setPenaltiesDialog, penaltyThreshold } = props;

  const penaltiesDialogContent = {
    agentName: content.name ?? "",
    penalties: content.penalties,
  };

  return (
    <Card className="animate-fade-down hover:bg-accent flex w-full flex-col justify-between gap-4 p-6 transition duration-500 sm:flex-row sm:items-center sm:gap-2">
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <CopyButton
            copy={content.key}
            variant="link"
            className="text-muted-foreground mt-0.5 h-5 items-center p-0 text-sm hover:text-white"
          >
            {smallAddress(content.key, 6)}
          </CopyButton>
          <EmissionHealthFactorBadge
            penaltyFactor={content.weightFactor ?? 0}
          />
        </div>
        <p>{content.name}</p>
        <PenaltyLabel
          penaltyThreshold={penaltyThreshold}
          penaltyLength={content.penalties.length}
          penaltyFactor={content.weightFactor ?? 0}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {content.penalties.length > 0 && (
          <Button
            variant="outline"
            className="border-red-600/10 bg-red-600/10 text-red-400 hover:bg-red-600/20"
            onClick={() => setPenaltiesDialog(penaltiesDialogContent)}
          >
            <span className="text-sm">Penalties</span>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link
            target="_blank"
            href={`${apiLinks.allocator}/agent/${content.key}`}
          >
            <span className="text-sm">See on Allocator</span>
            <ArrowRight size={12} />
          </Link>
        </Button>
      </div>
    </Card>
  );
};

const PenaltiesList = (props: { penalties?: PenaltyList }) => {
  const { penalties } = props;

  if (!penalties || penalties.length === 0) return <p>No penalties found</p>;

  return (
    <ListContainer>
      {penalties.map((penalty) => (
        <Card key={penalty.cadreKey}>
          <li className="relative flex h-full flex-col">
            <CardHeader className="w-full items-start justify-between">
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-3">
                  <CopyButton
                    copy={penalty.cadreKey}
                    variant="link"
                    className="text-muted-foreground h-5 items-center p-0 text-sm hover:text-white"
                  >
                    {smallAddress(penalty.cadreKey, 10)}
                  </CopyButton>
                  <span
                    className={`bg-muted-foreground/5 items-center rounded-full px-1.5 py-0.5 ${handleStatusColors(
                      penalty.executed,
                    )} text-xs font-medium ring-1 ring-inset`}
                  >
                    {penalty.executed ? "EXECUTED" : "PENDING"}
                  </span>
                </div>
                <div className="flex gap-4">
                  <p className="text-sm text-gray-500">
                    {DateTime.fromJSDate(penalty.createdAt).toLocaleString(
                      DateTime.DATETIME_SHORT,
                    )}
                  </p>
                </div>
              </div>
              <p className="text-pretty text-sm text-pink-400">
                Penalty Factor: {penalty.penaltyFactor}%
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-pretty">{penalty.content}</p>
            </CardContent>
          </li>
        </Card>
      ))}
    </ListContainer>
  );
};
