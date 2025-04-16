"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { AgentApplication, SS58Address } from "@torus-network/sdk";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";

import { Textarea } from "@torus-ts/ui/components/text-area";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { inferProcedureInput } from "@trpc/server";
import type { AppRouter } from "@torus-ts/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import {
  Slider
} from "@torus-ts/ui/components/slider"
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { BasicLogger } from "@torus-network/torus-utils/logger";

const log = BasicLogger.create({name: "penalty-manager"})

const MAX_CONTENT_CHARACTERS = 240;

const penaltyResolver = z.object({
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

type PenaltyFormData = NonNullable<
  inferProcedureInput<AppRouter["penalty"]["create"]>
>;


export function PenaltyManager({
  agentKey,
  status,
}: Readonly<{
  agentKey: SS58Address;
  status: AgentApplication["status"];
}>) {
  const { selectedAccount } = useGovernance();
  const { toast } = useToast();

  const form = useForm<PenaltyFormData>({
    resolver: zodResolver(penaltyResolver),
    defaultValues: {
      penaltyFactor: 1,
      content: "",
    },
  });

  const { handleSubmit, reset, control, watch } = form;

  const cadreList = api.cadre.all.useQuery();
  const isUserCadre = !!cadreList.data?.find(
    (cadre) => cadre.userKey === selectedAccount?.address,
  );

  const { data: agentList } = api.agent.all.useQuery();
  const { data: penaltiesByAgentKey, refetch: refetchPenalties } =
    api.penalty.byAgentKey.useQuery({ agentKey });

  const isAgentActive = agentList?.find((agent) => agent.key === agentKey);

  const createPenaltyMutation = api.penalty.create.useMutation();
  const deletePenaltyMutation = api.penalty.delete.useMutation();

  async function handleCreatePenaltyMutation(data: PenaltyFormData, agentKey: string){
    const mutationRes = await tryAsync(createPenaltyMutation.mutateAsync({...data, agentKey}))
    if (log.ifResultIsErr(mutationRes)){
      toast.error(mutationRes[0].message || "An unexpected error occurred. Please try again." )
      return ;
    }
    reset();
    void refetchPenalties();
    toast.success("Penalty applied successfully!")
  }


  async function handleDeletePenaltyMutation(agentKey: string){
    const mutationRes = await tryAsync(deletePenaltyMutation.mutateAsync({agentKey}))
    if (log.ifResultIsErr(mutationRes)){
      toast.error(mutationRes[0].message || "An unexpected error occurred. Please try again." )
      return ;
    }
    reset();
    void refetchPenalties();
    toast.success("Penalty removed successfully!")
}


  if (!("Resolved" in status) || !isAgentActive || !isUserCadre) {
    return null;
  }

  const appliedPenalty = penaltiesByAgentKey?.find(
    (penalty) => penalty.cadreKey === selectedAccount?.address,
  );

  if (appliedPenalty) {
    return (
      <Card className="flex flex-col gap-6 p-6">
        <CardHeader className="p-0">
          <CardTitle className="font-semibold text-red-500/80">Penalty Applied</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 p-0">
          <div className="flex justify-between text-sm">
            <p className="text-muted-foreground">Penalty factor</p>
            <span className="text-red-500/80">{appliedPenalty.penaltyFactor}%</span>
          </div>
          <div className="flex flex-col text-sm gap-1">
            <p className="text-muted-foreground">Penalty reason</p>
            <span className="break-words whitespace-pre-wrap">{appliedPenalty.content}</span>
          </div>
        </CardContent>
        <Button 
        className = "bg-gray-400"
        onClick={() => handleDeletePenaltyMutation(agentKey)}>
          Remove penalty
        </Button>
      </Card>
    );
  }


  const contentValue = watch("content");
  const remainingChars = MAX_CONTENT_CHARACTERS - (contentValue.length || 0);

  const onSubmit = (data: PenaltyFormData) => {
    if (!selectedAccount?.address) {
      toast.error("Please connect your wallet to apply a penalty")
      return;
    }
    void handleCreatePenaltyMutation(
      data,
      agentKey,
    );
  };

  return (

<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">
      Apply Penalty
    </Button>
  </DialogTrigger>

  <DialogContent className="flex-wrap flex-col max-w-xl border gap-6">
      <DialogHeader className="flex-col flex-wrap  text-left gap-2">
        <DialogTitle className="  text-2xl font-bold">
          Apply Penalty
        </DialogTitle>
        <DialogDescription className="font-mono text-base text-gray-400">
            Curator DAO members can penalize agents. Higher penalties reduce agent emissions and rewards.     
        </DialogDescription>
      </DialogHeader>

    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
      >
        <FormField
          control={control}
          name="penaltyFactor"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Penalty Factor</FormLabel>
              <FormControl>
                <div>
                  <Slider
                    value={[field.value]}
                    onValueChange={([value]) => field.onChange(value)}
                    max={100}
                    min={1}
                    step={1}
                    variant="destructive"
                    className="-mt-3 -mb-3"
                  />
                  <div className="text-right text-xs text-red-500/60 font-medium">
                    {field.value}%
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="content"
          render={({ field }) => (

            <FormItem >
              <FormLabel> Penalty Reason</FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="Why do you want to apply this penalty?"
                    {...field}
                    className=" h-32 w-full resize-none bg-gray-800/30 p-3 text-white"
                    maxLength={MAX_CONTENT_CHARACTERS}
                  />
                  <span className={`absolute bottom-2 right-2 text-sm ${
                    remainingChars <= 50
                      ? "text-yellow-400"
                      : "text-gray-400"
                  }`}>
                    {remainingChars} characters left
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
            )}
          />
        <Button
          type="submit"
          variant="destructive"
          disabled={
            createPenaltyMutation.isPending || !selectedAccount?.address
          }
        >
          {createPenaltyMutation.isPending ? "Awaiting signature" : "Submit penalty"}
        </Button>
      
        {!selectedAccount?.address && (
          <p className="text-sm text-yellow-500 text-left">
            Please connect your wallet to submit a request.
          </p>
        )}
    </form>
        </Form>
    </DialogContent>
  </Dialog>
  );
}