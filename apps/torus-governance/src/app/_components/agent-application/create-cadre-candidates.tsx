import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
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
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Icons } from "@torus-ts/ui/components/icons";
import { Textarea } from "@torus-ts/ui/components/text-area";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";
import type { inferProcedureInput } from "@trpc/server";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { DiscordAuthButton } from "../discord-auth-button";
import { useDiscordAuth } from "hooks/use-discord-auth";
import { isUserInServer } from "~/utils/discord-verification";
const MAX_CONTENT_CHARACTERS = 500;

type CreateCadreCandidateFormData = NonNullable<
  inferProcedureInput<AppRouter["cadreCandidate"]["create"]>
>;

export function CreateCadreCandidates() {
  const { selectedAccount } = useGovernance();

  const cadreCandidates = api.cadreCandidate.all.useQuery();

  const isUserCadreCandidate = !!cadreCandidates.data?.find(
    (user) => user.userKey === selectedAccount?.address,
  );

  const { toast } = useToast();

  const { discordId, userName, avatarUrl } = useDiscordAuth();
  const [isInDiscordServer, setIsInDiscordServer] =
    React.useState<boolean>(false);

  // Load saved form data from localStorage
  const savedFormData =
    typeof window !== "undefined"
      ? localStorage.getItem("cadreCandidateFormData")
      : null;

  let parsedFormData: Partial<CreateCadreCandidateFormData> = {};
  if (savedFormData) {
    const [parseError, parsed] = trySync<Partial<CreateCadreCandidateFormData>>(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      () => JSON.parse(savedFormData),
    );
    if (parseError !== undefined) {
      console.error("Error parsing saved form data:", parseError);
      // Clear corrupted data
      localStorage.removeItem("cadreCandidateFormData");
    } else {
      parsedFormData = parsed;
    }
  }

  const cadreForm = useForm<CreateCadreCandidateFormData>({
    defaultValues: {
      content: parsedFormData.content ?? "",
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    if (discordId) {
      const handleIsInServer = async (id: string): Promise<void> => {
        const [verifyError, isInServer] = await tryAsync(isUserInServer(id));

        if (verifyError !== undefined) {
          console.error("Error verifying Discord membership:", verifyError);
          setIsInDiscordServer(false);
          return;
        }
        setIsInDiscordServer(isInServer);
        if (!isInServer) {
          return;
        } else {
          cadreForm.clearErrors("discordId");
          return;
        }
      };

      cadreForm.setValue("discordId", discordId);
      void cadreForm.trigger("discordId");
      void handleIsInServer(discordId);
    }
  }, [discordId, cadreForm]);

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

  // Check if dialog should be open from sessionStorage
  React.useEffect(() => {
    const shouldBeOpen =
      sessionStorage.getItem("cadreCandidateDialogOpen") === "true";
    if (shouldBeOpen) {
      setDialogOpen(true);
      sessionStorage.removeItem("cadreCandidateDialogOpen");
    }
  }, []);

  // Add this ref to track if we're currently verifying
  const isVerifying = React.useRef(false);

  // Add this effect to prevent multiple verification calls
  React.useEffect(() => {
    // When the component unmounts or discordId changes, reset the verification flag
    return () => {
      isVerifying.current = false;
    };
  }, [discordId]);

  const createCadreCandidateMutation = api.cadreCandidate.create.useMutation();

  /**
   * Handles the cadre candidate creation process with multi-step validation.
   * Processes the form submission, stores data, saves Discord information if available,
   * and refreshes the cadre candidates list.
   *
   * @param data - Form data containing discordId and content required for submission
   */
  async function handleCreateCadreCandidate(
    data: CreateCadreCandidateFormData,
  ) {
    // Verify Discord membership before proceeding
    if (discordId) {
      const [verifyError, verificationResult] = await tryAsync(
        isUserInServer(discordId),
      );

      if (verifyError !== undefined) {
        toast.error("Failed to verify Discord membership. Please try again.");
        return;
      }

      if (!verificationResult) {
        toast.error("Please, join our Discord server before applying");
        return;
      }
    }

    const [createError, _createSuccess] = await tryAsync(
      createCadreCandidateMutation.mutateAsync({
        discordId: data.discordId,
        content: data.content,
      }),
    );

    // Handle creation errors
    if (createError !== undefined) {
      if (createError.message.includes("cadre_candidate_discord_id_unique")) {
        toast.error(
          "You have already applied to be a Curator DAO member with this Discord Account.",
        );
        return;
      }

      toast.error(
        createError.message ||
          "An unexpected error occurred. Please try again.",
      );
      return;
    }

    // Handle Discord info if available
    if (discordId && userName) {
      const saveDiscordMutation = api.discordInfo.create.useMutation();
      const [discordError] = await tryAsync(
        saveDiscordMutation.mutateAsync({
          discordId,
          userName,
          avatarUrl: avatarUrl ?? "",
        }),
      );
      if (discordError !== undefined) {
        toast.error("An error occurred while saving your Discord information.");
        return;
      }
    }

    // Reset form and refresh data
    cadreForm.reset();

    // Clear localStorage after successful submission
    localStorage.removeItem("cadreCandidateFormData");

    const [refetchError, _] = await tryAsync(cadreCandidates.refetch());
    if (refetchError !== undefined) {
      toast.error("Error refreshing data");
      return;
    }

    // Show success and close dialog
    toast.success("Curator DAO member request submitted successfully!");
    setDialogOpen(false);
  }

  const { handleSubmit, control, watch, formState, getValues } = cadreForm;
  const { isValid } = formState;

  // Save form data to localStorage whenever it changes
  const contentValue = watch("content");

  React.useEffect(() => {
    const formData = {
      content: contentValue,
    };
    localStorage.setItem("cadreCandidateFormData", JSON.stringify(formData));
  }, [contentValue]);

  const remainingChars = MAX_CONTENT_CHARACTERS - (contentValue.length || 0);

  const onSubmit = (data: CreateCadreCandidateFormData) => {
    if (!validateAndSubmit()) {
      return;
    }
    if (!selectedAccount?.address) {
      toast.error("Please connect your wallet to submit a request.");
      return;
    }
    if (isUserCadreCandidate) {
      toast.error(
        "You have already submitted a request to be a Curator DAO member.",
      );
      return;
    }
    if (!isValid) {
      toast.error("Please check the form for errors and try again.");
      return;
    }

    return handleCreateCadreCandidate(data);
  };

  // Function to prevent form submission when clicking Discord buttons
  const preventFormSubmission = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("dialog", "curator-apply");
    window.history.pushState({}, "", url);

    // Save dialog state to sessionStorage to reopen after auth
    sessionStorage.setItem("cadreCandidateDialogOpen", "true");
  };

  function handleDisableState() {
    return (
      createCadreCandidateMutation.isPending ||
      getValues("content").length < 10 ||
      !discordId ||
      !isInDiscordServer
    );
  }

  function handleOpenChange(open: boolean) {
    setDialogOpen(open);
  }

  // == Handle errors when you either
  // 1. Do not login your discord account
  // 2. Did not type in the content
  // 3. Not in Discord server
  function validateAndSubmit(): boolean {
    if (!discordId) {
      cadreForm.setError("discordId", {
        type: "manual",
        message: "Please log in with Discord first",
      });
      return false;
    }

    if (!isInDiscordServer) {
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
        <Button variant="outline" className="w-full">
          Apply to be a curator DAO member.
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl border text-center font-mono">
        <div className="p-6">
          <DialogHeader className="mb-6 font-mono">
            <DialogTitle className="pb-2 font-mono text-2xl font-bold">
              Apply to be a Curator DAO Member
            </DialogTitle>
            <DialogDescription className="mt-2 font-mono text-base text-gray-400">
              The Curator DAO member is a fundamental part of the ecosystem,
              with the ability to vote on whitelist applications and set
              penalties for agents. You must be part of the{" "}
              <a
                href="https://discord.gg/invite/torus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Torus Discord community
              </a>{" "}
              to be eligible to apply.
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
                render={() => (
                  <FormItem>
                    <FormControl>
                      <DiscordAuthButton onSignIn={preventFormSubmission} />
                    </FormControl>
                    <FormMessage />
                    {discordId && !isInDiscordServer && (
                      <div className="flex gap-1 text-xs text-red-400/60">
                        Please{" "}
                        <a
                          href="https://discord.gg/invite/torus"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 underline"
                        >
                          join our Discord server
                        </a>{" "}
                        before applying
                      </div>
                    )}
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
                          className="h-32 w-full resize-none"
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
                  `flex w-full items-center justify-center border border-blue-500 bg-blue-500/20
                  py-5 text-sm font-semibold text-blue-500 hover:bg-blue-600/20
                  hover:text-blue-400`,
                  handleDisableState() ? "cursor-not-allowed opacity-50" : "",
                )}
                disabled={handleDisableState()}
              >
                <Icons.Send className="mr-2" />
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
