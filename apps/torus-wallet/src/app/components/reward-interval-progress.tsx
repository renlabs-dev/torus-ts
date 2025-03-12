"use client";

import { CONSTANTS } from "@torus-ts/subspace";
import { Card } from "@torus-ts/ui/components/card";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useWallet } from "~/context/wallet-provider";

export function RewardIntervalProgress() {
  const { lastBlock, rewardInterval } = useWallet();
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

  if (timeLeft === null) return null;

  return (
    <Card className="animate-fade flex w-full flex-col gap-2 p-6">
      <span className="text-white">
        {String(time.minutes).padStart(2, "0")}:
        {String(time.seconds).padStart(2, "0")}
      </span>{" "}
      <div className="items flex items-center gap-2">
        <Clock size={16} />
        Next reward payout
      </div>
    </Card>
  );
}
