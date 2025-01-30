"use client";

import React from "react";
import { RunningAPRBar } from "./running-apr-bar";
import { useAPR } from "~/hooks/useAPR";

export function APRDisplay() {
  const { apr, isLoading, isError, totalStake, totalIssuance } = useAPR();

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="absolute top-14 text-center text-sm text-gray-500">
          Calculating APR...
        </div>
      </div>
    );
  }

  if (isError || apr === null) {
    return (
      <div className="absolute top-14 w-full">
        <div className="text-center text-sm text-red-500">
          Unable to calculate APR
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-14 w-full">
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
