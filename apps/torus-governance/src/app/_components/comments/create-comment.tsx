"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { fromRems } from "@torus-network/torus-utils/subspace";
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
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

const MAX_CHARACTERS = 2000;
const MAX_NAME_CHARACTERS = 25;
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

interface CreateCommentProps {
  content: string;
  itemId: number;
  itemType: "PROPOSAL" | "AGENT_APPLICATION";
  userName: string | undefined;
}

export function CreateComment({
  id,
  itemType,
}: Readonly<{
  id: number;
  itemType: "PROPOSAL" | "AGENT_APPLICATION";
}>) {
  const { selectedAccount, accountStakedBalance } = useGovernance();
  const { toast } = useToast();

  const hasEnoughBalance = React.useMemo(() => {
    if (!accountStakedBalance) return false;
    const formattedBalance = Number(fromRems(accountStakedBalance));
    return formattedBalance >= MIN_STAKE_REQUIRED;
  }, [accountStakedBalance]);

  // Store wallet connection status in a ref to handle wallet changes
  const walletConnectedRef = React.useRef<boolean>(false);
  React.useEffect(() => {
    if (selectedAccount?.address) {
      walletConnectedRef.current = true;
    }
  }, [selectedAccount?.address]);

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "", name: "" },
  });

  const { handleSubmit, reset, control, watch } = form;
  const contentValue = watch("content");
  const remainingChars = MAX_CHARACTERS - (contentValue.length || 0);

  const utils = api.useUtils();
  const createCommentMutation = api.comment.create.useMutation({
    onSuccess: async () => {
      // Invalidate the query cache to trigger a refetch
      await utils.comment.byId.invalidate();
      reset();
      toast.success("Comment submitted successfully!");
    },
  });

  async function handleCreateCommentMutation(data: CreateCommentProps) {
    const [error, _success] = await tryAsync(
      createCommentMutation.mutateAsync(data),
    );
    if (error !== undefined) {
      toast.error(
        error.message || "An unexpected error occurred. Please try again.",
      );
      return;
    }
  }

  const validateSubmission = (): boolean => {
    if (!selectedAccount?.address) {
      toast.error("Please, connect your wallet to submit a comment.");
      return false;
    }

    if (!hasEnoughBalance) {
      toast.error(
        `You need to have at least ${MIN_STAKE_REQUIRED} total staked balance to submit a comment.`,
      );
      return false;
    }

    return true;
  };

  const onSubmit = async (data: CommentFormData) => {
    if (!validateSubmission()) return;

    await handleCreateCommentMutation({
      content: data.content,
      itemId: id,
      itemType,
      userName: data.name,
    });
  };

  const isSubmitDisabled = React.useMemo(() => {
    if (
      createCommentMutation.isPending ||
      !selectedAccount?.address ||
      !contentValue.length ||
      !hasEnoughBalance
    ) {
      return true;
    }

    return false;
  }, [
    createCommentMutation.isPending,
    selectedAccount?.address,
    contentValue.length,
    hasEnoughBalance,
  ]);

  const renderOverlay = () => {
    // No wallet connected
    if (!selectedAccount?.address) {
      return (
        <>
          <div className="bg-dark/80 absolute inset-0 z-10 bg-opacity-80"></div>
          <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center text-sm">
            <p className="mt-2 text-center text-lg">
              Please connect your wallet to submit a comment.
            </p>
          </div>
        </>
      );
    }

    // Not enough balance
    if (!hasEnoughBalance) {
      return (
        <>
          <div className="bg-dark/80 absolute inset-0 z-10 bg-opacity-80"></div>
          <div className="absolute inset-0 z-50 flex w-full flex-col items-center justify-center text-sm">
            <p className="mt-2 text-center text-lg">
              You need to have at least {MIN_STAKE_REQUIRED} TORUS total staked
              balance to submit a comment.
            </p>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div
      className="animate-fade-down animate-delay-700 hidden h-fit min-h-max flex-col items-center
        justify-between text-white md:flex"
    >
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
                      className="rounded-radius border-muted bg-card placeholder:text-muted-foreground h-24
                        w-full resize-none border p-3 text-white"
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
                      className="rounded-radius border-muted bg-card placeholder:text-muted-foreground w-full
                        border p-3 text-white"
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
              disabled={isSubmitDisabled}
            >
              {createCommentMutation.isPending ? "Awaiting Signature" : "Post"}
            </Button>
          </form>
        </Form>

        {renderOverlay()}
      </div>
    </div>
  );
}
