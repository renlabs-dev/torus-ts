"use client";

import { Card } from "@torus-ts/ui";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

import { useWallet } from "~/context/wallet-provider";

const BLOCK_TIME = 8;

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
      const secondsUntilNext = blocksUntilNext * BLOCK_TIME;

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
    <Card className="flex w-full animate-fade flex-col gap-2 p-6">
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
