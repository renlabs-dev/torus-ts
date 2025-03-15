"use client";

import { APRBarBase } from "./apr-bar-base";
import { APRBarSkeleton } from "./apr-bar-skeleton";
import { APREntry } from "./apr-entry";
import { useMemo } from "react";
import { useAPR } from "~/hooks/useAPR";

export interface APRData {
  apr: number;
  totalStake: bigint | undefined;
  stakedPercentage: number;
}

export function APRBar() {
  const { apr, isLoading, totalStake, totalIssuance } = useAPR();

  const calculateStakedPercentage = useMemo(() => {
    return (): number => {
      const totalSupply = Number(totalStake ?? 0n) + Number(totalIssuance);

      return totalStake && totalSupply
        ? (Number(totalStake) * 100) / totalSupply
        : 0;
    };
  }, [totalStake, totalIssuance]);

  if (isLoading) {
    return <APRBarSkeleton />;
  }

  const aprData = {
    apr: apr ?? 0,
    totalStake: totalStake ?? 0n,
    stakedPercentage: calculateStakedPercentage(),
  };

  return (
    <APRBarBase>
      {[0, 1].map((setIndex) => (
        <div key={setIndex} className="flex gap-32">
          {Array.from({ length: 5 }).map((_, index) => (
            <APREntry key={`${setIndex}-${index}`} {...aprData} />
          ))}
        </div>
      ))}
    </APRBarBase>
  );
}
