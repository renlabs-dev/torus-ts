"use client";

import { KeyboardOff } from "lucide-react";
import DashboardRedirectCard from "./dashboard-redirect-card";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { Badge } from "@torus-ts/ui/components/badge";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { Coins } from "lucide-react";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { ContentNotFound } from "@torus-ts/ui/components/content-not-found";
import { useAgentHealth } from "hooks/use-agent-health";
import { ScrollFadeEffect } from "~/app/_components/scroll-fade-effect";

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

export default function DashboardAgentHealthCard() {
  const { filteredAgents, penaltyThreshold, isFetching } = useAgentHealth({});

  return (
    <DashboardRedirectCard
      redirectPath="/agents"
      icon={KeyboardOff}
      title="Agents Health"
    >
      <div className="relative">
        <ScrollArea className="sm:max-h-[22em] max-h-48">
          {isFetching ? (
            <div className="text-sm">Loading...</div>
          ) : filteredAgents.length === 0 ? (
            <ContentNotFound message="No agents found" />
          ) : (
            <div className="flex flex-col gap-3 pb-2">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.key}
                  className="border-border bg-card/50 hover:bg-accent flex flex-col py-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 justify-between w-full">
                      <CopyButton
                        copy={agent.key}
                        variant="link"
                        className="text-muted-foreground h-5 items-center p-0 text-sm hover:text-white"
                      >
                        {smallAddress(agent.key, 6)}
                      </CopyButton>
                      <EmissionHealthFactorBadge
                        penaltyFactor={agent.weightFactor ?? 0}
                      />
                    </div>
                  </div>
                  <div className="mt-1 flex flex-col">
                    <p className="text-sm">{agent.name}</p>
                    <PenaltyLabel
                      penaltyThreshold={penaltyThreshold}
                      penaltyLength={agent.penalties.length}
                      penaltyFactor={agent.weightFactor ?? 0}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <ScrollFadeEffect />
      </div>
    </DashboardRedirectCard>
  );
}
