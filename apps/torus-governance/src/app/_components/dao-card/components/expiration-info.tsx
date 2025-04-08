"use client";

import { getExpirationTime } from "@torus-ts/utils";
import { Clock } from "lucide-react";

interface ExpirationInfoProps {
  expirationBlock: number;
  currentBlock?: number;
}

export function ExpirationInfo({
  expirationBlock,
  currentBlock,
}: Readonly<ExpirationInfoProps>) {
  return (
    <span className="text-muted-foreground line-clamp-1 flex w-fit items-center gap-1.5 truncate text-sm">
      <Clock size={14} />
      {currentBlock && currentBlock < expirationBlock ? "Ends" : "Ended"}{" "}
      {getExpirationTime(currentBlock, expirationBlock, true)}
    </span>
  );
}
