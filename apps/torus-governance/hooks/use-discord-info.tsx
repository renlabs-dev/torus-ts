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

  const saveDiscordInfoMutation =
    api.discordInfo.create.useMutation<DiscordInfoFormData>({
      onSuccess: () => {
        toast({
          title: "Success!",
          description: "Discord information saved successfully!",
        });
      },
      onError: (err) => {
        toast({
          title: "Uh oh! Something went wrong.",
          description:
            err.message ?? "An unexpected error occurred. Please try again.",
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

      const formValues = form.getValues();
      if (formValues.discordId && formValues.userName && formValues.avatarUrl) {
        await saveDiscordInfoMutation.mutateAsync({
          discordId: formValues.discordId,
          userName: formValues.userName,
          avatarUrl: formValues.avatarUrl,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error saving discord info:", error);
      return false;
    }
  };

  return {
    form,
    saveDiscordInfo,
  };
}
