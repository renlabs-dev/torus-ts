"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { Crown } from "lucide-react";

interface AuthorInfoProps {
  author: SS58Address;
}

export function AuthorInfo({ author }: Readonly<AuthorInfoProps>) {
  return (
    <span
      className="text-muted-foreground line-clamp-1 flex w-fit items-center gap-1.5 truncate
        text-sm"
    >
      <Crown size={14} />
      {smallAddress(author)}
    </span>
  );
}
