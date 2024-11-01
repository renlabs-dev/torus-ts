"use client";

import { Info } from "lucide-react";

import { useTorus } from "@torus-ts/providers/use-torus";
import { formatToken } from "@torus-ts/utils";

export default function ProposalRewardCard() {
  const { rewardAllocation } = useTorus();

  return (
    <div className="fixed bottom-0 left-0 z-50 animate-fade-down rounded-md border border-white/20 py-2.5">
      <div className="mx-auto flex max-w-screen-md items-center gap-1 px-2">
        <Info className="h-6 w-6 text-green-500 md:h-5 md:w-5" />
        <p className="text-gray-400">
          Next DAO incentives payout:{" "}
          <span
            className={`text-green-500 ${!rewardAllocation && "animate-pulse"}`}
          >
            {rewardAllocation
              ? formatToken(Number(rewardAllocation))
              : "Loading Reward..."}
          </span>{" "}
          $COMAI
        </p>
      </div>
    </div>
  );
}
