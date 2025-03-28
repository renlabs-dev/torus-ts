"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { SS58Address } from "@torus-network/sdk";
import { Button } from "@torus-ts/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { Textarea } from "@torus-ts/ui/components/text-area";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { formatToken } from "@torus-network/torus-utils/subspace";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const MAX_CHARACTERS = 300;
const MAX_NAME_CHARACTERS = 300;
const MIN_STAKE_REQUIRED = 2000;

const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Please enter a comment")
    .max(MAX_CHARACTERS, `Comment cannot exceed ${MAX_CHARACTERS} characters`),
  name: z
    .string()
    .max(
      MAX_NAME_CHARACTERS,
      `Name cannot exceed ${MAX_NAME_CHARACTERS} characters`,
    )
    .optional(),
});

type CommentFormData = z.infer<typeof commentSchema>;

export function CreateComment({
  id,
  itemType,
  author,
}: Readonly<{
  id: number;
  itemType: "PROPOSAL" | "AGENT_APPLICATION";
  author?: SS58Address;
}>) {
  const { selectedAccount, accountStakedBalance } = useGovernance();
  const utils = api.useUtils();
  const { toast } = useToast();

  const cadreList = api.cadre.all.useQuery();
  const isUserCadre = !!cadreList.data?.find(
    (cadre) => cadre.userKey === selectedAccount?.address,
  );

  const CreateCommentMutation = api.comment.create.useMutation({
    onSuccess: async () => {
      reset();
      toast({
        title: "Success!",
        description: "Comment submitted successfully!",
      });
      await utils.comment.byId.invalidate({ proposalId: id });
    },
    onError: (error) => {
      toast({
        title: "Uh oh! Something went wrong.",
        description:
          error.message || "An unexpected error occurred. Please try again.",
      });
    },
  });

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "", name: "" },
  });

  const { handleSubmit, reset, control, watch } = form;

  const contentValue = watch("content");
  const remainingChars = MAX_CHARACTERS - (contentValue.length || 0);

  const onSubmit = async (data: CommentFormData) => {
    if (!selectedAccount?.address) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: "Please connect your wallet to submit a comment.",
      });
      return;
    }
    if (itemType === "PROPOSAL") {
      const staked = accountStakedBalance
        ? Number(formatToken(accountStakedBalance))
        : 0;
      if (staked < MIN_STAKE_REQUIRED) {
        toast({
          title: "Uh oh! Something went wrong.",
          description: `You need to have at least ${MIN_STAKE_REQUIRED} total staked balance to submit a comment.`,
        });
        return;
      }
    }
    if (
      itemType === "AGENT_APPLICATION" &&
      !isUserCadre &&
      author !== selectedAccount.address
    ) {
      toast({
        title: "Uh oh! Something went wrong.",
        description:
          "Only Curator DAO members can submit comments in DAO mode.",
      });
      return;
    }
    try {
      await CreateCommentMutation.mutateAsync({
        content: data.content,
        itemId: id,
        itemType,
        userName: data.name ?? undefined,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Uh oh! Something went wrong.",
          description: err.errors[0]?.message ?? "Invalid input",
        });
      } else {
        toast({
          title: "Uh oh! Something went wrong.",
          description: "An unexpected error occurred. Please try again.",
        });
      }
    }
  };

  const isSubmitDisabled = () => {
    if (CreateCommentMutation.isPending || !selectedAccount?.address)
      return true;
    if (itemType === "PROPOSAL") {
      const staked = accountStakedBalance
        ? Number(formatToken(accountStakedBalance))
        : 0;
      return staked < MIN_STAKE_REQUIRED;
    }
    return !isUserCadre && author !== selectedAccount.address;
  };

  const setOverlay = () => {
    if (!selectedAccount?.address) return true;
    if (itemType === "PROPOSAL") {
      const staked = accountStakedBalance
        ? Number(formatToken(accountStakedBalance))
        : 0;
      if (staked < MIN_STAKE_REQUIRED) return true;
    }
    if (
      itemType === "AGENT_APPLICATION" &&
      !isUserCadre &&
      author !== selectedAccount.address
    ) {
      return true;
    }
    return false;
  };

  return (
    <div className="animate-fade-down animate-delay-200 hidden h-fit min-h-max flex-col items-center justify-between text-white md:flex">
      <div className="mb-2 w-full pb-1">
        <h2 className="text-start text-lg font-semibold">Create a Comment</h2>
      </div>
      <div className="relative w-full">
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full flex-col gap-2"
          >
            <FormField
              control={control}
              name="content"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormControl>
                    <Textarea
                      placeholder="Type your message here..."
                      {...field}
                      className="rounded-radius border-muted bg-card placeholder:text-muted-foreground h-24 w-full resize-none border p-3 text-white"
                      maxLength={MAX_CHARACTERS}
                    />
                  </FormControl>
                  <FormMessage />
                  <span className="text-muted-foreground absolute bottom-3 right-4 text-sm">
                    {remainingChars} characters left
                  </span>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Type your name (optional)"
                      {...field}
                      className="rounded-radius border-muted bg-card placeholder:text-muted-foreground w-full border p-3 text-white"
                      maxLength={MAX_NAME_CHARACTERS}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              variant="outline"
              className="py-6 transition"
              disabled={
                isSubmitDisabled() ||
                CreateCommentMutation.isPending ||
                !selectedAccount?.address ||
                !contentValue.length
              }
            >
              {CreateCommentMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </form>
        </Form>

        {setOverlay() && (
          <div className="absolute inset-0 z-10 bg-black bg-opacity-80"></div>
        )}

        {!selectedAccount?.address && itemType === "PROPOSAL" && (
          <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center text-sm">
            <p className="mt-2 text-center text-lg">
              Please connect your wallet to submit a comment.
            </p>
          </div>
        )}

        {selectedAccount?.address &&
          accountStakedBalance &&
          Number(formatToken(accountStakedBalance)) < MIN_STAKE_REQUIRED &&
          itemType === "PROPOSAL" && (
            <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center text-sm">
              <p className="mt-2 text-center text-lg">
                You need to have at least {MIN_STAKE_REQUIRED} TORUS total
                staked balance to submit a comment.
              </p>
            </div>
          )}

        {!selectedAccount?.address && itemType === "AGENT_APPLICATION" && (
          <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center text-sm">
            <p className="mt-2 text-center text-sm">
              Are you a Curator DAO member?
            </p>
            <p className="mt-2 text-center text-sm">
              Please connect your wallet to comment.
            </p>
          </div>
        )}

        {selectedAccount &&
          !isUserCadre &&
          author !== selectedAccount.address &&
          itemType === "AGENT_APPLICATION" && (
            <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center gap-0.5">
              <p className="mt-2 text-center text-lg">
                You must be a Curator DAO member to comment on agent
                applications.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
