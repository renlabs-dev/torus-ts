"use client";

import { APRBarBase } from "./apr-bar-base";
import { AppBarDataGroup, AppBarSeparator } from "./apr-bar-shared";
import { useGetTorusPrice } from "@torus-ts/query-provider/hooks";
import { formatToken } from "@torus-ts/utils/subspace";
import { Fragment, useMemo } from "react";
import { useAPR } from "~/hooks/useAPR";

export interface APRData {
  apr: number;
  totalStake: bigint;
  stakedPercentage: number;
  usdPrice: number;
}

export function APRBar() {
  const { apr, isLoading, totalStake, totalIssuance } = useAPR();
  const { data: usdPrice } = useGetTorusPrice();

  const stakedPercentage = useMemo(() => {
    const totalSupply = Number(totalStake ?? 0n) + Number(totalIssuance);
    return totalStake && totalSupply
      ? (Number(totalStake) * 100) / totalSupply
      : 0;
  }, [totalStake, totalIssuance]);

  const infos = useMemo(
    () => [
      {
        label: "APR",
        value: `${apr?.toFixed(2) ?? 0}%`,
      },
      {
        label: "TOTAL STAKED",
        value: formatToken(totalStake ?? 0n),
        unit: "$TORUS",
      },
      {
        label: "STAKED RATIO",
        value: `${stakedPercentage.toFixed(2)}%`,
      },
      {
        label: "USD PRICE",
        value: `$${usdPrice?.toFixed(4) ?? 0}`,
      },
    ],
    [apr, totalStake, stakedPercentage, usdPrice],
  );

  return (
    <APRBarBase>
      {[0, 1].map((setIndex) => (
        <div key={setIndex} className="flex gap-32">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              className="flex items-center font-mono text-sm tracking-tight"
              key={`${setIndex}-${index}`}
            >
              <div className="flex items-center">
                {infos.map((info, index) => (
                  <Fragment key={index}>
                    <AppBarDataGroup
                      label={info.label}
                      value={info.value}
                      unit={info.unit}
                      isLoading={isLoading}
                    />
                    {index < infos.length - 1 && <AppBarSeparator />}
                  </Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </APRBarBase>
  );
}
