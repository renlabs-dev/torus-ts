"use client";

import { useLayoutEffect, useState } from "react";

import type { ProposalStatus } from "@torus-ts/subspace/old";
import { useProcessVotesAndStakes } from "@torus-ts/providers/hooks";
import { toast } from "@torus-ts/providers/use-toast";
import { useTorus } from "@torus-ts/providers/use-torus";
import { Button, Card, CardHeader } from "@torus-ts/ui";
import { copyToClipboard } from "@torus-ts/ui/utils";
import { smallAddress } from "@torus-ts/utils/subspace";

interface VoterListProps {
  proposalStatus: ProposalStatus;
}

export function VoterList({ proposalStatus }: VoterListProps): JSX.Element {
  const { api, torusCacheUrl } = useTorus();
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(
    null,
  );

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
      <Card className="animate-fade-down p-6 animate-delay-500">
        <CardHeader className="pl-0 pt-0">
          <h3>Voters List</h3>
        </CardHeader>
        <p className="animate-pulse">Loading voters...</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="animate-fade-down p-6 animate-delay-500">
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
      <Card className="animate-fade-down border-muted p-6 animate-delay-500">
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
    <div className="flex flex-col gap-4">
      <span className="text-lg">
        <h3>Voters List</h3>
      </span>
      <div
        className="relative flex max-h-72 w-full flex-col gap-2 overflow-auto pr-2"
        ref={setContainerNode}
      >
        {voters.map(({ address, vote }) => (
          <Button
            variant="default"
            key={address}
            className="flex w-full animate-fade-down items-center justify-between border-muted px-6 py-8 animate-delay-500 hover:text-muted-foreground"
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
          className={`fixed -bottom-5 flex w-full items-end justify-center ${isAtBottom ? "h-4 animate-fade" : "h-24 animate-fade"} bg-gradient-to-b from-[#04061C1A] to-[#04061C] transition-all duration-100`}
        />
      </div>
    </div>
  );
}
