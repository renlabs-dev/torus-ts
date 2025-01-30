"use client";

import React from "react";
import { RunningAPRBar } from "./running-apr-bar";
import { useAPR } from "~/hooks/useAPR";
import { SkeletonLoader } from "./apr-bar-skeleton";

export function APRDisplay() {
  const { apr, isLoading, isError, totalStake, totalIssuance } = useAPR();

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (isError || apr === null) {
    return <SkeletonLoader />;
  }

  return (
    <div className="absolute top-[3.4em] w-full">
      <RunningAPRBar
        apr={apr}
        totalStaked={BigInt(totalStake?.toString() ?? "0")}
        totalSupply={
          BigInt(totalStake?.toString() ?? "0") +
          BigInt(totalIssuance?.toString() ?? "0")
        }
      />
    </div>
  );
}
