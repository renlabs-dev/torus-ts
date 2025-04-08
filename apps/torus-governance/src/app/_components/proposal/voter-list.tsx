"use client";

import type { VoteWithStake } from "@torus-network/sdk";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardHeader } from "@torus-ts/ui/components/card";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { copyToClipboard } from "@torus-ts/ui/lib/utils";
import { useLayoutEffect, useState } from "react";

interface VoterListProps {
  voters: VoteWithStake[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function VoterList(props: Readonly<VoterListProps>) {
  const { isError, isLoading, voters } = props;
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(
    null,
  );

  const { toast } = useToast();

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

  if (isLoading) {
    return (
      <Card className="animate-fade-down animate-delay-500 p-4 md:p-6">
        <CardHeader className="pl-0 pt-0">
          <h3>Voters List</h3>
        </CardHeader>
        <p className="animate-pulse">Loading voters...</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="animate-fade-down animate-delay-500 p-4 md:p-6">
        <CardHeader className="pl-0 pt-0">
          <h3>Voters List</h3>
        </CardHeader>
        <p className="text-red-400">
          Error loading voters. Please try again later.
        </p>
      </Card>
    );
  }

  if (!voters || voters.length === 0) {
    return (
      <Card className="animate-fade-down border-muted animate-delay-[1400ms] p-4 md:p-6">
        <CardHeader className="pl-0 pt-0">
          <h3>Voters List</h3>
        </CardHeader>
        <p className="text-muted-foreground">
          This proposal has no voters yet or is closed.
        </p>
      </Card>
    );
  }

  const handleCopyAddress = async (address: string) => {
    await copyToClipboard(address);
    toast({
      title: "Success!",
      description: "Address copied to clipboard.",
    });
  };

  return (
    <div className="animate-fade-down animate-delay-700 flex h-full min-h-max flex-col items-start justify-between gap-4 text-white">
      <span className="text-lg">
        <h3>Voters List</h3>
      </span>
      <div
        className="relative flex max-h-72 w-full flex-col gap-2 overflow-auto pr-2"
        ref={setContainerNode}
      >
        {voters.map(({ address, vote }) => (
          <Button
            variant="outline"
            key={address}
            className="animate-fade-down border-muted bg-card animate-delay-500 hover:bg-accent hover:text-muted-foreground flex w-full items-center justify-between px-6 py-8"
            onClick={() => handleCopyAddress(address as string)}
          >
            {smallAddress(address as string)}
            <div className="flex flex-col items-end">
              <span
                className={
                  vote === "IN_FAVOR" ? "text-green-500" : "text-red-500"
                }
              >
                {vote === "IN_FAVOR" ? "In Favor" : "Against"}
              </span>
            </div>
          </Button>
        ))}
        <span
          className={`fixed -bottom-5 flex w-full items-end justify-center ${isAtBottom ? "animate-fade h-0" : "animate-fade h-8"} to-background bg-gradient-to-b from-transparent transition-all duration-100`}
        />
      </div>
    </div>
  );
}
