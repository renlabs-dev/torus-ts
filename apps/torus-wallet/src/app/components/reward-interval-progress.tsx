"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@torus-ts/ui";
import { cn } from "@torus-ts/ui";
import { useWallet } from "~/context/wallet-provider";

const BLOCK_TIME = 8;

export function RewardIntervalProgress() {
  const { lastBlock, rewardInterval } = useWallet();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [time, setTime] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    if (
      !lastBlock.data?.blockNumber ||
      !rewardInterval.data ||
      rewardInterval.data <= 0n
    ) {
      return;
    }

    const interval = Number(rewardInterval.data);
    const currentBlock = Number(lastBlock.data.blockNumber);
    const blocksIntoInterval = currentBlock % interval;
    const blocksUntilNext = interval - blocksIntoInterval;
    const secondsUntilNext = blocksUntilNext * BLOCK_TIME;

    setTimeLeft(secondsUntilNext);
    setProgress((blocksIntoInterval / interval) * 100);
  }, [lastBlock.data?.blockNumber, rewardInterval.data]);

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) return prev;
        return prev - 1;
      });

      const minutes = Math.floor((timeLeft - 1) / 60);
      const seconds = (timeLeft - 1) % 60;
      setTime({ minutes, seconds });
    }, 1000);

    // Initial set
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    setTime({ minutes, seconds });

    return () => clearInterval(timer);
  }, [timeLeft]);

  if (timeLeft === null) return null;

  return (
    <Card className="w-full animate-fade">
      <CardHeader className="flex items-center justify-center pb-2 pt-6">
        <CardTitle className="text-lg font-semibold tracking-tight text-muted-foreground">
          Next Reward Payout
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-6">
        <div className="mb-6 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold tabular-nums tracking-wider">
              {String(time.minutes).padStart(2, "0")}:
              {String(time.seconds).padStart(2, "0")}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              MINUTES : SECONDS
            </div>
          </div>
        </div>
        <div className="h-[2px] w-full overflow-hidden rounded-full bg-secondary/20">
          <div
            className={cn(
              "h-full rounded-full bg-foreground/80 transition-all duration-500",
              timeLeft < 60 && "animate-pulse",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
