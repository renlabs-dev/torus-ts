"use client";

import { smallAddress } from "@torus-network/torus-utils/subspace";
import type { AppRouter } from "@torus-ts/api";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardTitle } from "@torus-ts/ui/components/card";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { copyToClipboard } from "@torus-ts/ui/lib/utils";
import type { inferProcedureOutput } from "@trpc/server";
import { useLayoutEffect, useState } from "react";

type PenaltyList = NonNullable<
  inferProcedureOutput<AppRouter["penalty"]["byAgentKey"]>
>;

interface VoterListProps {
  penalties: PenaltyList;
}

export function PenaltyList(props: Readonly<VoterListProps>) {
  const { penalties } = props;

  const { toast } = useToast();

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
    toast({
      title: "Success!",
      description: "Address copied to clipboard.",
    });
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
            className="animate-fade-down border-muted bg-card animate-delay-500 hover:bg-accent hover:text-muted-foreground flex w-full items-center justify-between px-4 py-6 hover:cursor-pointer"
            onClick={() => handleCopyAddress(cadreKey)}
          >
            {smallAddress(cadreKey)}
            <span className="text-pink-500">{penaltyFactor}%</span>
          </Button>
        ))}
        <span
          className={`fixed -bottom-5 flex w-full items-end justify-center ${isAtBottom ? "animate-fade h-0" : "animate-fade h-8"} to-background bg-gradient-to-b from-transparent transition-all duration-100`}
        />
      </div>
    </Card>
  );
}
