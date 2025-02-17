"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@torus-ts/toast-provider";
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Textarea,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@torus-ts/ui";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

const MAX_CONTENT_CHARACTERS = 500;

const createCadreCandidateSchema = z.object({
  discordId: z
    .string()
    .min(17, "Discord ID must be at least 17 digits")
    .max(20, "Discord ID must be at most 20 digits")
    .regex(/^\d+$/, "Discord ID must contain only digits"),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(
      MAX_CONTENT_CHARACTERS,
      `Content must be at most ${MAX_CONTENT_CHARACTERS} characters`,
    ),
});

type CreateCadreCandidateFormData = z.infer<typeof createCadreCandidateSchema>;

export function CreateCadreCandidates() {
  const {
    selectedAccount,
    cadreCandidates,
    isUserCadre,
    isUserCadreCandidate,
  } = useGovernance();

  const form = useForm<CreateCadreCandidateFormData>({
    resolver: zodResolver(createCadreCandidateSchema),
    defaultValues: {
      discordId: "",
      content: "",
    },
  });

  if (isUserCadre || !selectedAccount) {
    return null;
  }

  const createCadreCandidateMutation = api.cadreCandidate.create.useMutation({
    onSuccess: async () => {
      reset();
      await cadreCandidates.refetch();
      toast.success("Curator DAO member request submitted successfully!");
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again.",
      );
    },
  });

  const { handleSubmit, reset, control, watch } = form;

  const contentValue = watch("content");
  const remainingChars = MAX_CONTENT_CHARACTERS - (contentValue.length || 0);

  const onSubmit = (data: CreateCadreCandidateFormData) => {
    if (!selectedAccount.address) {
      toast.error("Please connect your wallet to submit a request.");
      return;
    }
    if (isUserCadreCandidate) {
      toast.error(
        "You have already submitted a request to be a Curator DAO member.",
      );
      return;
    }
    createCadreCandidateMutation.mutate({
      discordId: data.discordId,
      content: data.content,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="animate-fade-down">
          Apply to join the Curator DAO
        </Button>
      </PopoverTrigger>
      <PopoverContent className="mt-2 hidden w-[25em] md:block xl:mr-0">
        <div className="mt-1 flex w-full flex-col gap-2 border-b border-white/20 pb-3">
          <p className="text-sm">
            The Curator DAO votes on agent/module applications.
          </p>
          <p className="text-sm">Interested in joining? Apply below.</p>
        </div>
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-4 flex flex-col gap-4"
          >
            <FormField
              control={control}
              name="discordId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discord ID (17-20 digits)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Discord ID"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/[^0-9]/g, "")
                          .slice(0, 20);
                        field.onChange(value);
                      }}
                      minLength={17}
                      maxLength={20}
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
                  <FormLabel>
                    Why do you want to join the Curator DAO?
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea
                        placeholder="Why do you want to join the Curator DAO?"
                        {...field}
                        className="h-32 w-full resize-none bg-gray-600/10 p-3 text-white"
                        maxLength={MAX_CONTENT_CHARACTERS}
                      />
                      <span className="absolute bottom-2 right-2 text-sm text-gray-400">
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
              variant="default"
              disabled={
                createCadreCandidateMutation.isPending ||
                !selectedAccount.address
              }
            >
              {createCadreCandidateMutation.isPending
                ? "Submitting..."
                : "Submit"}
            </Button>

            {!selectedAccount.address && (
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
