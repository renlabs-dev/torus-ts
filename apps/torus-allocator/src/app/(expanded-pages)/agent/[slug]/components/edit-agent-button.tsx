"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import Link from "next/link";

interface EditAgentButtonProps {
  agentKey: string;
}

export function EditAgentButton({ agentKey }: EditAgentButtonProps) {
  const { selectedAccount } = useTorus();
  const isOwner = selectedAccount?.address === agentKey;

  if (!isOwner) {
    return null;
  }

  return (
    <Button
      asChild
      variant="outline"
      className="flex w-full items-center gap-1.5 border-green-500 p-3 text-green-500 opacity-65
        transition duration-200 hover:text-green-500 hover:opacity-100"
    >
      <Link href={`/agent/${agentKey}/edit`}>Edit Agent Info</Link>
    </Button>
  );
}
