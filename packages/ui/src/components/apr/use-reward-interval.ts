"use client";

import type { ApiPromise } from "@polkadot/api";
import { CONSTANTS } from "@torus-network/sdk/constants";
import {
  useLastBlock,
  useRewardInterval,
} from "@torus-ts/query-provider/hooks";
import { useEffect, useState } from "react";

export function useRewardIntervalProgress(api: ApiPromise | null) {
  const lastBlock = useLastBlock(api);
  const rewardInterval = useRewardInterval(api);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [time, setTime] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    if (
      !lastBlock.data?.blockNumber ||
      !rewardInterval.data ||
      rewardInterval.data <= 0n
    ) {
      return;
    }

    const calculateTimeLeft = () => {
      const interval = Number(rewardInterval.data);
      const currentBlock = Number(lastBlock.data.blockNumber);
      const blocksIntoInterval = currentBlock % interval;
      const blocksUntilNext = interval - blocksIntoInterval;
      const secondsUntilNext =
        blocksUntilNext * CONSTANTS.TIME.BLOCK_TIME_SECONDS;

      setTimeLeft(secondsUntilNext);
    };

    calculateTimeLeft();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          calculateTimeLeft();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lastBlock.data?.blockNumber, rewardInterval.data]);

  useEffect(() => {
    if (timeLeft === null) return;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    setTime({ minutes, seconds });
  }, [timeLeft]);

  const minutes = String(time.minutes).padStart(2, "0");
  const seconds = String(time.seconds).padStart(2, "0");

  return {
    minutes,
    seconds,
    full: `${minutes}:${seconds}`,
  };
}
