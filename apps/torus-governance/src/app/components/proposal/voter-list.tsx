"use client";

import type { VoteWithStake } from "@torus-ts/subspace";
import { toast } from "@torus-ts/toast-provider";
import { Button, Card, CardHeader } from "@torus-ts/ui";
import { copyToClipboard } from "@torus-ts/ui/utils";
import { smallAddress } from "@torus-ts/utils/subspace";
import { useLayoutEffect, useState } from "react";

interface VoterListProps {
  voters: VoteWithStake[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function VoterList(props: Readonly<VoterListProps>): JSX.Element {
  const { isError, isLoading, voters } = props;
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

  if (isLoading) {
    return (
      <Card className="animate-fade-down p-4 animate-delay-500 md:p-6">
        <CardHeader className="pl-0 pt-0">
          <h3>Voters List</h3>
        </CardHeader>
        <p className="animate-pulse">Loading voters...</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="animate-fade-down p-4 animate-delay-500 md:p-6">
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
      <Card className="animate-fade-down border-muted p-4 animate-delay-[1400ms] md:p-6">
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
    toast.success("Address copied to clipboard");
  };

  return (
    <div className="flex h-full min-h-max animate-fade-down flex-col items-start justify-between gap-4 text-white animate-delay-700">
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
            className="flex w-full animate-fade-down items-center justify-between border-muted bg-card px-6 py-8 animate-delay-500 hover:bg-accent hover:text-muted-foreground"
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
          className={`fixed -bottom-5 flex w-full items-end justify-center ${isAtBottom ? "h-0 animate-fade" : "h-8 animate-fade"} bg-gradient-to-b from-transparent to-background transition-all duration-100`}
        />
      </div>
    </div>
  );
}
