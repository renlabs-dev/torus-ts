"use client";

import { SkeletonAgentCardFooter } from "./agent-card-skeleton-loader";
import { useTorus } from "@torus-ts/torus-provider";
import { CardFooter } from "@torus-ts/ui/components/card";
import { Label } from "@torus-ts/ui/components/label";
import { Slider } from "@torus-ts/ui/components/slider";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";

interface AgentCardFooterProps {
  id: number;
  name: string;
  agentKey: string;
  metadataUri: string | null;
  registrationBlock: number | null;
  percComputedWeight: number | null;
  weightFactor: number | null;
}

export function AgentCardFooter(props: Readonly<AgentCardFooterProps>) {
  const {
    delegatedAgents,
    addAgent,
    updateBalancedPercentage,
    getAgentPercentage,
    setPercentageChange,
    removeZeroPercentageAgents,
  } = useDelegateAgentStore();
  const { selectedAccount, isInitialized } = useTorus();

  const currentPercentage = getAgentPercentage(props.agentKey);

  const isAgentDelegated = delegatedAgents.some(
    (a) => a.address === props.agentKey,
  );

  const handlePercentageChange = (value: number[]) => {
    const newPercentage = value[0];
    if (typeof newPercentage !== "number") {
      console.error("Invalid slider value");
      return;
    }

    setPercentageChange(true);

    if (!isAgentDelegated && newPercentage > 0) {
      addAgent({
        id: props.id,
        name: props.name,
        address: props.agentKey,
        metadataUri: props.metadataUri,
        registrationBlock: props.registrationBlock ?? null,
        percComputedWeight: props.percComputedWeight ?? null,
        weightFactor: props.weightFactor ?? null,
      });
    }

    updateBalancedPercentage(props.agentKey, newPercentage);

    removeZeroPercentageAgents();
  };

  if (!isInitialized) {
    return <SkeletonAgentCardFooter />;
  }

  return (
    <CardFooter className="mt-4 flex justify-between">
      <Label className="absolute mb-3 flex items-center gap-1.5 pb-1 text-xs font-semibold">
        Your current allocation:{" "}
        <span className="text-cyan-500">{currentPercentage}%</span>
      </Label>

      <Slider
        value={[currentPercentage]}
        onValueChange={handlePercentageChange}
        max={100}
        step={0.1}
        className="relative z-30 mt-6 py-1"
        disabled={!selectedAccount?.address}
      />
    </CardFooter>
  );
}
