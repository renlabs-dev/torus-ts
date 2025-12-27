"use client";

import { formatToken } from "@torus-network/torus-utils/torus/token";
import { Fragment, useMemo } from "react";
import { APRBarBase } from "./apr-bar-base";
import { AppBarDataGroup, AppBarSeparator } from "./apr-bar-shared";

interface APRInfo {
  label: string;
  value: string;
  unit?: string;
  isLoading?: boolean;
}

interface APRBarProps {
  apr?: number;
  usdPrice?: number;
  totalStake?: bigint;
  totalIssuance?: bigint;
  isLoading?: boolean;
  rewardIntervalProgress?: {
    full: string;
  };
}

export function APRBar({
  apr,
  usdPrice,
  totalStake,
  totalIssuance,
  isLoading = false,
  rewardIntervalProgress,
}: APRBarProps) {
  const stakedPercentage = useMemo(() => {
    if (!totalStake || !totalIssuance) return "0.00";
    // totalIssuance already includes totalStake
    const percentage = (totalStake * 10000n) / totalIssuance;
    return (Number(percentage) / 100).toFixed(2);
  }, [totalStake, totalIssuance]);

  const staticInfos = useMemo<APRInfo[]>(
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
        value: `${stakedPercentage}%`,
      },
      {
        label: "USD PRICE",
        value: `$${usdPrice?.toFixed(4) ?? 0}`,
      },
    ],
    [apr, totalStake, stakedPercentage, usdPrice],
  );

  const dynamicInfo: APRInfo = {
    label: "REWARD INTERVAL",
    value: rewardIntervalProgress?.full ?? "00:00",
  };

  const infos = [...staticInfos, dynamicInfo];

  return (
    <APRBarBase>
      <div className="sr-only" aria-live="polite">
        {infos
          .map((info) => `${info.label}: ${info.value} ${info.unit ?? ""}`)
          .join(", ")}
      </div>
      {[0, 1].map((setIndex) => (
        <div key={setIndex} className="flex gap-32">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              className="flex items-center font-mono text-sm tracking-tight"
              key={`${setIndex}-${index}`}
              aria-hidden={true}
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
