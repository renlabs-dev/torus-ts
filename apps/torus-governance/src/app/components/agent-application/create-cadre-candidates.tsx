"use client";

import DiscordLogin from "../discord-auth-button";
import type { AppRouter } from "@torus-ts/api";
import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Icons } from "@torus-ts/ui/components/icons";
import { Textarea } from "@torus-ts/ui/components/text-area";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";
import type { inferProcedureInput } from "@trpc/server";
import { useDiscordInfoForm } from "hooks/use-discord-info";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

const MAX_CONTENT_CHARACTERS = 500;

type CreateCadreCandidateFormData = NonNullable<
  inferProcedureInput<AppRouter["cadreCandidate"]["create"]>
>;

export function CreateCadreCandidates() {
  const {
    selectedAccount,
    cadreCandidates,
    isUserCadre,
    isUserCadreCandidate,
  } = useGovernance();
  const { toast } = useToast();
  const [discordId, setDiscordId] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  const { saveDiscordInfo } = useDiscordInfoForm(
    discordId,
    userName,
    avatarUrl,
  );

  const cadreForm = useForm<CreateCadreCandidateFormData>({
    defaultValues: {
      discordId: "",
      content: "",
    },
    mode: "onChange",
  });

  // == Handle the dialog state ==
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = React.useState(
    searchParams.get("dialog") === "curator-apply",
  );

  React.useEffect(() => {
    if (dialogOpen) {
      const url = new URL(window.location.href);
      url.searchParams.set("dialog", "curator-apply");
      window.history.pushState({}, "", url);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("dialog");
      window.history.pushState({}, "", url);
    }
  }, [dialogOpen]);

  // =================================

  // Set the discordId in the cadreForm when it changes
  React.useEffect(() => {
    if (discordId) {
      cadreForm.setValue("discordId", discordId);
      void cadreForm.trigger("discordId");
    }
  }, [discordId, cadreForm]);

  if (isUserCadre || !selectedAccount) {
    return null;
  }

  const createCadreCandidateMutation = api.cadreCandidate.create.useMutation({
    onSuccess: async () => {
      try {
        if (discordId && userName) {
          console.log("Saving Discord info");
          const discordSaveResult = await saveDiscordInfo();
          if (!discordSaveResult) {
            toast({
              title: "Uh oh! Something went wrong.",
              description:
                "An error occurred while saving your Discord information.",
            });
          }
        }
        cadreForm.reset();
        await cadreCandidates.refetch();
        toast({
          title: "Success!",
          description: "Curator DAO member request submitted successfully!",
        });
        setDialogOpen(false);
      } catch (error) {
        toast({
          title: "Uh oh! Something went wrong.",
          description:
            "An error occurred while saving your Discord information.",
        });
        console.error("Error saving Discord info:", error);
      }
    },
    onError: (error) => {
      toast({
        title: "Uh oh! Something went wrong.",
        description:
          error.message || "An unexpected error occurred. Please try again.",
      });
    },
  });

  const { handleSubmit, control, watch, formState, getValues } = cadreForm;
  const { isValid } = formState;

  const contentValue = watch("content");
  const remainingChars = MAX_CONTENT_CHARACTERS - (contentValue.length || 0);

  const onSubmit = (data: CreateCadreCandidateFormData) => {
    if (!validateAndSubmit()) {
      return;
    }
    if (!selectedAccount.address) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: "Please connect your wallet to submit a request.",
      });
      return;
    }
    if (isUserCadreCandidate) {
      toast({
        title: "Uh oh! Something went wrong.",
        description:
          "You have already submitted a request to be a Curator DAO member.",
      });
      return;
    }
    if (!isValid) {
      toast({
        title: "Form validation failed",
        description: "Please check the form for errors and try again.",
      });
      return;
    }
    createCadreCandidateMutation.mutate({
      discordId: data.discordId,
      content: data.content,
    });
  };

  // Function to prevent form submission when clicking Discord buttons
  const preventFormSubmission = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("dialog", "curator-apply");
    window.history.pushState({}, "", url);
  };

  function handleDisableState() {
    return (
      createCadreCandidateMutation.isPending ||
      getValues("content").length < 10 ||
      !discordId
    );
  }

  function handleOpenChange(open: boolean) {
    setDialogOpen(open);
  }

  // == Handle errors when you either
  // 1. Do not login your discord account
  // 2. Did not type in the content
  function validateAndSubmit(): boolean {
    if (!discordId) {
      cadreForm.setError("discordId", {
        type: "manual",
        message: "Please log in with Discord first",
      });
      return false;
    }

    // Check for content length
    if (getValues("content").length < 10) {
      cadreForm.setError("content", {
        type: "manual",
        message: "Content must be at least 10 characters",
      });
      return false;
    }
    return true;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="animate-fade-down">
          Apply to be a curator DAO member.
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl border border-[#262631] bg-[#0E0E11] p-6 text-center font-mono text-white">
        <div className="p-6">
          <DialogHeader className="mb-6 font-mono">
            <DialogTitle className="pb-2 font-mono text-2xl font-bold">
              Apply to be a Curator DAO Member
            </DialogTitle>
            <DialogDescription className="mt-2 font-mono text-base text-gray-400">
              The Curator DAO member is a fundamental part of the ecosystem, it
              can do actions like vote on whitelist applications and can set
              penalties to agents.
            </DialogDescription>
          </DialogHeader>

          <Form {...cadreForm}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              <FormField
                control={control}
                name="discordId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <DiscordLogin
                        onAuthChange={(id, name, avatar) => {
                          setDiscordId(id);
                          setUserName(name);
                          setAvatarUrl(avatar);
                          if (id) {
                            field.onChange(id);
                          }
                        }}
                        onButtonClick={preventFormSubmission}
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
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder="Why do you want to join the Curator DAO?"
                          {...field}
                          className="h-32 w-full resize-none border border-gray-700 bg-gray-800/30 p-4 text-white"
                          maxLength={MAX_CONTENT_CHARACTERS}
                        />
                        <span
                          className={`absolute bottom-2 right-2 text-sm ${
                            remainingChars <= 50
                              ? "text-yellow-400"
                              : "text-gray-400"
                          }`}
                        >
                          {remainingChars} characters left
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                onClick={() => {
                  if (validateAndSubmit()) {
                    void handleSubmit(onSubmit)();
                  }
                }}
                variant="outline"
                className={cn(
                  "flex w-full items-center justify-center border border-blue-500 bg-blue-500/20 py-5 text-sm font-semibold text-blue-500 hover:bg-blue-600/20 hover:text-blue-400",
                  handleDisableState() ? "cursor-not-allowed opacity-50" : "",
                )}
              >
                <Icons.Send />
                {createCadreCandidateMutation.isPending
                  ? "Waiting for Signature..."
                  : "Submit Application"}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
