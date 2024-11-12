"use client";

import type { ProposalStatus } from "@torus-ts/types";
import { useProcessVotesAndStakes } from "@torus-ts/providers/hooks";
import { toast } from "@torus-ts/providers/use-toast";
import { useTorus } from "@torus-ts/providers/use-torus";
import { copyToClipboard, smallAddress } from "@torus-ts/utils";

import { Button, Card, CardHeader } from "@torus-ts/ui";
import { useLayoutEffect, useState } from "react";

interface VoterListProps {
  proposalStatus: ProposalStatus;
}

export function VoterList({ proposalStatus }: VoterListProps): JSX.Element {
  const { api, torusCacheUrl } = useTorus();
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);

  const votesFor = "open" in proposalStatus ? proposalStatus.open.votesFor : [];
  const votesAgainst =
    "open" in proposalStatus ? proposalStatus.open.votesAgainst : [];

  const {
    data: voters,
    isLoading,
    isError,
  } = useProcessVotesAndStakes(api, torusCacheUrl, votesFor, votesAgainst);

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
      <Card className="p-6 animate-fade-down animate-delay-500">
        <CardHeader className="pt-0 pl-0">
          <h3>Voters List</h3>
        </CardHeader>
        <p className="animate-pulse">Loading voters...</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6 animate-fade-down animate-delay-500">
        <CardHeader className="pt-0 pl-0">
          <h3>Voters List</h3>
        </CardHeader>
        <p className="text-red-400">Error loading voters. Please try again later.</p>
      </Card>
    );
  }

  if (!voters || voters.length === 0) {
    return (
      <Card className="p-6 border-muted animate-fade-down animate-delay-500">
        <CardHeader className="pt-0 pl-0">
          <h3>Voters List</h3>
        </CardHeader>
        <p className="text-muted-foreground">This proposal has no voters yet or is closed.</p>
      </Card>
    );
  }

  const handleCopyAddress = (address: string) => {
    copyToClipboard(address);
    toast.success("Address copied to clipboard");
  };

  return (
    <div className="flex flex-col gap-4">
      <span className="text-lg">
        <h3>Voters List</h3>
      </span>
      <div className="relative flex flex-col w-full gap-2 pr-2 overflow-auto max-h-72" ref={setContainerNode}>
        {voters.map(({ address, vote }) => (
          <Button
            variant="default"
            key={address}
            className="flex items-center justify-between w-full px-6 py-8 border-muted hover:text-muted-foreground animate-fade-down animate-delay-500"
            onClick={() => handleCopyAddress(address as string)}
          >
            {smallAddress(address as string)}
            <div className="flex flex-col items-end">
              <span
                className={
                  vote === "In Favor" ? "text-green-500" : "text-red-500"
                }
              >
                {vote}
              </span>
            </div>
          </Button>
        ))}
        <span
          className={`fixed -bottom-5 flex items-end justify-center w-full ${isAtBottom ? "h-4 animate-fade" : "h-24 animate-fade"} duration-100 transition-all  bg-gradient-to-b from-[#04061C1A] to-[#04061C]`}
        />
      </div>
    </div>
  );
}
