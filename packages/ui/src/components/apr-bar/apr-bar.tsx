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

/**
 * Render an informational APR bar showing APR, total staked, staked ratio, USD price, and the reward interval.
 *
 * @param apr - Annual percentage rate to display (may be undefined to show default `0%`)
 * @param usdPrice - Token USD price to display (may be undefined to show default `$0`)
 * @param totalStake - Total amount staked as a `bigint` (used to compute staked ratio)
 * @param totalIssuance - Total token issuance as a `bigint` (used to compute staked ratio)
 * @param isLoading - When true, data groups show a loading state (defaults to `false`)
 * @param rewardIntervalProgress - Object containing `full` string for reward interval display; falls back to `"00:00"` when absent
 * @returns The APR bar React element containing repeated data groups and separators for visual layout
 */
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
    const totalSupply = (totalStake || 0n) + (totalIssuance || 0n);
    const percentage = (totalStake * 10000n) / totalSupply;
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