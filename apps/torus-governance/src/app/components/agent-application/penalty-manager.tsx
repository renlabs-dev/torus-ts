"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { AgentApplication, SS58Address } from "@torus-ts/subspace";
import { toast } from "@torus-ts/toast-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@torus-ts/ui/components/popover";
import { Textarea } from "@torus-ts/ui/components/text-area";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

const MAX_CONTENT_CHARACTERS = 240;

const penaltySchema = z.object({
  penaltyFactor: z.preprocess(
    (val) => Number(val),
    z
      .number()
      .min(1, "Penalty factor must be at least 1")
      .max(100, "Penalty factor must be at most 100"),
  ),
  content: z
    .string()
    .min(1, "Please enter a reason for the penalty")
    .max(
      MAX_CONTENT_CHARACTERS,
      `Content must be at most ${MAX_CONTENT_CHARACTERS} characters`,
    ),
});

type PenaltyFormData = z.infer<typeof penaltySchema>;

export function PenaltyManager({
  agentKey,
  status,
}: Readonly<{
  agentKey: SS58Address;
  status: AgentApplication["status"];
}>) {
  const { selectedAccount, isUserCadre } = useGovernance();

  const { data: agentList } = api.agent.all.useQuery();
  const { data: penaltiesByAgentKey, refetch: refetchPenalties } =
    api.penalty.byAgentKey.useQuery({ agentKey });

  const isAgentActive = agentList?.find((agent) => agent.key === agentKey);

  const createPenaltyMutation = api.penalty.create.useMutation({
    onSuccess: () => {
      reset();
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
      reset();
      void refetchPenalties();
      toast.success("Penalty deleted successfully!");
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again.",
      );
    },
  });

  const form = useForm<PenaltyFormData>({
    resolver: zodResolver(penaltySchema),
    defaultValues: {
      penaltyFactor: 1,
      content: "",
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
            <p className="text-muted-foreground">Penalty factor</p>
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

  const { handleSubmit, reset, control, watch } = form;

  const contentValue = watch("content");
  const remainingChars = MAX_CONTENT_CHARACTERS - (contentValue.length || 0);

  const onSubmit = (data: PenaltyFormData) => {
    if (!selectedAccount?.address) {
      toast.error("Please connect your wallet to apply a penalty.");
      return;
    }
    createPenaltyMutation.mutate({
      agentKey,
      penaltyFactor: data.penaltyFactor,
      content: data.content,
    });
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
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-4 flex flex-col gap-4"
          >
            <FormField
              control={control}
              name="penaltyFactor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Penalty Factor (1-100)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter penalty factor"
                      {...field}
                      min={1}
                      max={100}
                      step={1}
                      className="w-full bg-gray-600/10 p-3 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="content"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Penalty Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Why do you want to apply this penalty?"
                      {...field}
                      className="h-32 w-full resize-none bg-gray-600/10 p-3 text-white"
                      maxLength={MAX_CONTENT_CHARACTERS}
                    />
                  </FormControl>
                  <FormMessage />
                  <span className="absolute bottom-2 right-2 text-sm text-gray-400">
                    {remainingChars} characters left
                  </span>
                </FormItem>
              )}
            />

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
        </Form>
      </PopoverContent>
    </Popover>
  );
}
