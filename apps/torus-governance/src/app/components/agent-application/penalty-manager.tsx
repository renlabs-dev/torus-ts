"use client";

import { useState } from "react";
import { z } from "zod";

import { toast } from "@torus-ts/toast-provider";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Textarea,
} from "@torus-ts/ui";

import type { AgentApplication, SS58Address } from "@torus-ts/subspace";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

const MAX_CONTENT_CHARACTERS = 240;

export function PenaltyManager({
  agentKey,
  status,
}: {
  agentKey: SS58Address;
  status: AgentApplication["status"];
}) {
  const [penaltyFactor, setPenaltyFactor] = useState(1);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [remainingChars, setRemainingChars] = useState(MAX_CONTENT_CHARACTERS);

  const { selectedAccount, isUserCadre } = useGovernance();

  const { data: agentList } = api.agent.all.useQuery();
  const { data: penaltiesByAgentKey, refetch: refetchPenalties } =
    api.penalty.byAgentKey.useQuery({
      agentKey,
    });

  const isAgentActive = agentList?.find((agent) => agent.key === agentKey);

  const createPenaltyMutation = api.penalty.create.useMutation({
    onSuccess: () => {
      setPenaltyFactor(0);
      setContent("");
      void refetchPenalties();
      toast.success("Penalty applied successfully!");
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again.",
      );
    },
  });

  const deletePenaltyMutation = api.penalty.delete.useMutation({
    onSuccess: () => {
      setPenaltyFactor(0);
      setContent("");
      void refetchPenalties();
      toast.success("Penalty deleted successfully!");
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again.",
      );
    },
  });

  if (!("Resolved" in status) || !isAgentActive || !isUserCadre) {
    return null;
  }

  const appliedPenalty = penaltiesByAgentKey?.find(
    (penalty) => penalty.cadreKey === selectedAccount?.address,
  );

  if (appliedPenalty) {
    return (
      <Card className="flex flex-col gap-4 p-6">
        <CardHeader className="p-0">
          <CardTitle className="font-semibold">Penalty Applied</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-0">
          <div className="flex justify-between text-sm">
            <p className="text-muted-foreground">Penalty factor </p>
            <span>{appliedPenalty.penaltyFactor}%</span>
          </div>
          <div className="flex flex-col gap-1.5 text-sm">
            <p className="text-muted-foreground">Penalty reason</p>
            <span>{appliedPenalty.content}</span>
          </div>
        </CardContent>
        <Button onClick={() => deletePenaltyMutation.mutate({ agentKey })}>
          Remove penalty
        </Button>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAccount?.address) {
      toast.error("Please connect your wallet to apply a penalty.");
      return;
    }

    if (content === "") {
      toast.error("Please enter a reason for the penalty.");
      return;
    }

    try {
      createPenaltyMutation.mutate({
        agentKey,
        penaltyFactor,
        content,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message ?? "Invalid input");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setRemainingChars(MAX_CONTENT_CHARACTERS - newContent.length);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="animate-fade-down">
          Apply Penalty
        </Button>
      </PopoverTrigger>
      <PopoverContent className="mt-2 w-[25em] xl:mr-0" align="center">
        <div className="mt-1 flex w-full border-b border-white/20 pb-3">
          <p className="text-sm">
            The Curator DAO member is allowed to apply a penalty to an agent.
            The penalty factor is a number between 1 and 100. The higher the
            penalty factor, the more the agent's emissions will be affected.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <Input
            type="number"
            placeholder="Penalty factor between 1 and 0 (e.g., 0.4)"
            value={penaltyFactor}
            min={1}
            max={100}
            maxLength={3}
            step={1}
            onChange={(e) => setPenaltyFactor(Number(e.target.value))}
            className="w-full bg-gray-600/10 p-3 text-white"
          />
          <div className="relative">
            <Textarea
              placeholder="Why do you want to apply this penalty?"
              value={content}
              onChange={handleContentChange}
              className="h-32 w-full resize-none bg-gray-600/10 p-3 text-white"
              maxLength={MAX_CONTENT_CHARACTERS}
            />
            <span className="absolute bottom-2 right-2 text-sm text-gray-400">
              {remainingChars} characters left
            </span>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            variant="default"
            disabled={
              createPenaltyMutation.isPending || !selectedAccount?.address
            }
          >
            {createPenaltyMutation.isPending ? "Submitting..." : "Submit"}
          </Button>
          {!selectedAccount?.address && (
            <p className="text-sm text-yellow-500">
              Please connect your wallet to submit a request.
            </p>
          )}
        </form>
      </PopoverContent>
    </Popover>
  );
}
