"use client";

import type { AppRouter } from "@torus-ts/api";
import { toast } from "@torus-ts/toast-provider";
import { Button, Card, CardTitle } from "@torus-ts/ui";
import { copyToClipboard } from "@torus-ts/ui/utils";
import { smallAddress } from "@torus-ts/utils/subspace";
import type { inferProcedureOutput } from "@trpc/server";
import { useLayoutEffect, useState } from "react";

type PenaltyList = NonNullable<
  inferProcedureOutput<AppRouter["penalty"]["byAgentKey"]>
>;

interface VoterListProps {
  penalties: PenaltyList;
}

export function PenaltyList(props: VoterListProps): JSX.Element {
  const { penalties } = props;

  const [isAtBottom, setIsAtBottom] = useState(false);
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!containerNode) {
      return;
    }

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = containerNode;
      setIsAtBottom(scrollHeight - scrollTop === clientHeight);
    };

    containerNode.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      containerNode.removeEventListener("scroll", handleScroll);
    };
  }, [containerNode]);

  const handleCopyAddress = async (address: string) => {
    await copyToClipboard(address);
    toast.success("Address copied to clipboard");
  };

  return (
    <Card className="p-6">
      <CardTitle className="mb-6 flex flex-row items-center justify-between text-lg font-semibold">
        Penalties List
      </CardTitle>
      <div
        className="relative flex max-h-72 w-full flex-col gap-2 overflow-auto pr-2"
        ref={setContainerNode}
      >
        {penalties.map(({ cadreKey, penaltyFactor }) => (
          <Button
            variant="outline"
            key={cadreKey}
            className="flex w-full animate-fade-down items-center justify-between border-muted bg-card px-4 py-6 animate-delay-500 hover:cursor-pointer hover:bg-accent hover:text-muted-foreground"
            onClick={() => handleCopyAddress(cadreKey)}
          >
            {smallAddress(cadreKey)}
            <span className="text-pink-500">{penaltyFactor}%</span>
          </Button>
        ))}
        <span
          className={`fixed -bottom-5 flex w-full items-end justify-center ${isAtBottom ? "h-0 animate-fade" : "h-8 animate-fade"} bg-gradient-to-b from-transparent to-background transition-all duration-100`}
        />
      </div>
    </Card>
  );
}
