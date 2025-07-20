"use client";

import { CardFooter } from "../card";
import { Label } from "../label";
import { Slider } from "../slider";
import { SkeletonAgentCardFooter } from "./agent-card-skeleton-loader";

export interface AgentCardFooterProps {
  currentPercentage?: number;
  onPercentageChange?: (value: number) => void;
  isAccountConnected?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function AgentCardFooter({
  currentPercentage,
  onPercentageChange,
  isAccountConnected = false,
  isLoading = false,
  children,
}: Readonly<AgentCardFooterProps>) {
  const handleSliderChange = (value: number[]) => {
    const newPercentage = value[0];
    if (typeof newPercentage === "number" && onPercentageChange) {
      onPercentageChange(newPercentage);
    }
  };

  if (isLoading) {
    return <SkeletonAgentCardFooter />;
  }

  const showAllocationControls =
    onPercentageChange && currentPercentage !== undefined;

  if (!showAllocationControls && !children) {
    return null;
  }

  return (
    <CardFooter className="mt-4 flex flex-col items-start">
      {showAllocationControls && (
        <>
          <Label className="flex items-center gap-1 text-xs font-semibold">
            Your current allocation:{" "}
            <span className="text-cyan-500">{currentPercentage}%</span>
          </Label>

          <Slider
            value={[currentPercentage]}
            onValueChange={handleSliderChange}
            max={100}
            step={0.1}
            className="relative z-30"
            disabled={!isAccountConnected}
          />
        </>
      )}
      {children}
    </CardFooter>
  );
}
