import type { AppRouter } from "@torus-ts/api";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import type { inferProcedureInput } from "@trpc/server";
import * as React from "react";
import { useForm } from "react-hook-form";
import { api } from "~/trpc/react";

type DiscordInfoFormData = NonNullable<
  inferProcedureInput<AppRouter["discordInfo"]["create"]>
>;

export function useDiscordInfoForm(
  discordId: string | null,
  userName: string | null,
  avatarUrl: string | null,
) {
  const { toast } = useToast();

  const form = useForm<DiscordInfoFormData>({
    defaultValues: {
      discordId: discordId ?? "",
      userName: userName ?? "",
      avatarUrl: avatarUrl ?? "",
    },
  });

  React.useEffect(() => {
    form.setValue("discordId", discordId ?? "");
    form.setValue("userName", userName ?? "");
    form.setValue("avatarUrl", avatarUrl ?? "");
  }, [discordId, userName, avatarUrl, form]);

  const saveDiscordInfoMutation = api.discordInfo.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Discord information saved successfully!",
      });
    },
    onError: (err) => {
      const error = err as { message?: string };
      toast({
        title: "Uh oh! Something went wrong.",
        description:
          typeof error.message === "string"
            ? error.message
            : "An unexpected error occurred. Please try again.",
      });
    },
  });

  const saveDiscordInfo = async (): Promise<boolean> => {
    try {
      if (!userName || !avatarUrl) {
        return false;
      }

      const isValid = await form.trigger();
      if (!isValid) return false;

      await saveDiscordInfoMutation.mutateAsync({
        discordId: discordId ?? "",
        userName: userName,
        avatarUrl: avatarUrl,
      });

      return true;
    } catch (error) {
      console.log("error", error);
      return false;
    }
  };

  return {
    form,
    saveDiscordInfo,
    isSaving: saveDiscordInfoMutation.isPending,
  };
}
