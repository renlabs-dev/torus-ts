"use client";

import { toast } from "@torus-ts/toast-provider";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardHeader } from "@torus-ts/ui/components/card";
import { copyToClipboard } from "@torus-ts/ui/lib/utils";
import { smallAddress } from "@torus-ts/utils/subspace";
import { useLayoutEffect, useState } from "react";

interface VoterListProps {
  voters:
    | {
        userKey: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        id: number;
        vote: "ACCEPT" | "REFUSE" | "REMOVE";
        applicationId: number;
      }[]
    | undefined;
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
      <Card className="animate-fade-down animate-delay-200 p-4 md:p-6">
        <CardHeader className="pl-0 pt-0">
          <h3>Voters List</h3>
        </CardHeader>
        <p className="animate-pulse">Loading voters...</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <div className="animate-fade-down animate-delay-700 flex h-full min-h-max flex-col items-start justify-between gap-4 text-white">
        <span className="text-lg">
          <h3>Voters List</h3>
        </span>
        <Card className="flex h-full w-full items-center justify-center p-4">
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-muted-foreground">
              Error loading voters. Please try again later.
            </span>
          </div>
        </Card>
      </div>
    );
  }

  if (!voters || voters.length === 0) {
    return (
      <div className="animate-fade-down animate-delay-700 flex h-full min-h-max flex-col items-start justify-between gap-4 text-white">
        <span className="text-lg">
          <h3>Voters List</h3>
        </span>
        <Card className="flex h-full w-full items-center justify-center p-4">
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-muted-foreground">
              This agent has no voters yet.
            </span>
          </div>
        </Card>
      </div>
    );
  }

  const handleCopyAddress = async (address: string) => {
    await copyToClipboard(address);
    toast.success("Address copied to clipboard");
  };

  const getVoteLabel = (vote: "ACCEPT" | "REFUSE" | "REMOVE") => {
    const voteLabels = {
      ACCEPT: <span className="text-green-500">In Favor</span>,
      REFUSE: <span className="text-red-500">Against</span>,
      REMOVE: <span className="text-pink-500">Remove</span>,
    };

    return voteLabels[vote];
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
        {voters.map(({ userKey: address, vote }) => (
          <Button
            variant="outline"
            key={address}
            className="animate-fade-down border-muted bg-card animate-delay-500 hover:bg-accent hover:text-muted-foreground flex w-full items-center justify-between px-6 py-8"
            onClick={() => handleCopyAddress(address)}
          >
            {smallAddress(address)}
            <div className="flex flex-col items-end">{getVoteLabel(vote)}</div>
          </Button>
        ))}
        <span
          className={`fixed -bottom-5 flex w-full items-end justify-center ${isAtBottom ? "animate-fade h-0" : "animate-fade h-8"} bg-gradient-to-b from-transparent to-black transition-all duration-100`}
        />
      </div>
    </div>
  );
}
