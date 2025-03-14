"use client";

import DiscordLogin from "../discord-auth-button";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@torus-ts/ui/components/alert-dialog";
import { Button } from "@torus-ts/ui/components/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Textarea } from "@torus-ts/ui/components/text-area";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useDiscordInfoForm } from "hooks/use-discord-info";
import { useSession } from "next-auth/react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";

const MAX_CONTENT_CHARACTERS = 500;
// == Manage Cadre Candidate Schema ==
const createCadreCandidateSchema = z.object({
  discordId: z
    .string()
    .min(17)
    .max(20)
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
  const { toast } = useToast();
  const [discordId, setDiscordId] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const { saveDiscordInfo, isSaving } = useDiscordInfoForm(
    discordId,
    userName,
    avatarUrl,
  );

  const cadreForm = useForm<CreateCadreCandidateFormData>({
    resolver: zodResolver(createCadreCandidateSchema),
    defaultValues: {
      discordId: "",
      content: "",
    },
    mode: "onChange",
  });

  // Set the discordId in the cadreForm when it changes
  React.useEffect(() => {
    if (discordId) {
      cadreForm.setValue("discordId", discordId);
      // Trigger validation to update the form state
      void cadreForm.trigger("discordId");
    }
  }, [discordId, cadreForm]);

  const { data: session } = useSession();
  React.useEffect(() => {
    if (session?.expires) {
      const intervalId = setInterval(() => {
        const expiryTime = new Date(session.expires).getTime();
        const now = Date.now();
        const remainingSecs = Math.max(
          0,
          Math.floor((expiryTime - now) / 1000),
        );
        console.log(`Session expires in: ${remainingSecs} seconds`);
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [session]);

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
        setDialogOpen(false); // Close the dialog on success
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

  const { handleSubmit, control, watch, formState } = cadreForm;
  const { isValid } = formState;

  const contentValue = watch("content");
  const remainingChars = MAX_CONTENT_CHARACTERS - (contentValue.length || 0);

  const onSubmit = (data: CreateCadreCandidateFormData) => {
    console.log("Session during submission:", session);
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
    console.log("Preventing form submission");
  };

  // Paper airplane/send icon for submit button
  const SendIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mr-2"
    >
      <path
        d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <AlertDialog open={dialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="secondary"
          className="animate-fade-down"
          onClick={() => setDialogOpen(true)}
        >
          Apply to be a curator DAO member.
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-xl border border-[#262631] bg-[#0E0E11] p-6 text-center font-mono text-white">
        <div className="p-6">
          <AlertDialogHeader className="mb-6 font-mono">
            <AlertDialogTitle className="pb-2 font-mono text-2xl font-bold">
              Apply to be a Curator DAO Member
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 font-mono text-base text-gray-400">
              The Curator DAO member is a fundamental part of the ecosystem, it
              can do actions like vote on whitelist applications and can set
              penalties to agents.
            </AlertDialogDescription>
          </AlertDialogHeader>

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
                type="submit"
                variant="outline"
                className={`flex w-full items-center justify-center border border-blue-500 bg-blue-500/20 py-5 text-sm font-semibold text-blue-500 hover:bg-blue-700 ${
                  createCadreCandidateMutation.isPending ||
                  isSaving ||
                  !selectedAccount.address ||
                  !discordId ||
                  !isValid ||
                  contentValue.length < 10
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
                disabled={
                  createCadreCandidateMutation.isPending ||
                  isSaving ||
                  !selectedAccount.address ||
                  !discordId ||
                  !isValid ||
                  contentValue.length < 10
                }
              >
                <SendIcon />
                {createCadreCandidateMutation.isPending
                  ? "Submitting Application..."
                  : isSaving
                    ? "Saving Discord info..."
                    : "Submit Application"}
              </Button>
              {!discordId && selectedAccount.address && (
                <p className="-mt-3 text-sm text-yellow-500">
                  Please connect your Discord account to continue.
                </p>
              )}
            </form>
          </Form>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
