import type { AppRouter } from "@torus-ts/api";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { inferProcedureInput } from "@trpc/server";
import { api } from "~/trpc/react";
import * as React from "react";
import { useForm } from "react-hook-form";

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
    api.discordInfo.create.useMutation<DiscordInfoFormData>();

  const saveDiscordInfo = async (): Promise<boolean> => {
    // Early validation
    if (!userName || !avatarUrl) {
      return false;
    }
    
    // Form validation
    const [triggerError, isValid] = await tryAsync(form.trigger());
    if (triggerError !== undefined || !isValid) {
      return false;
    }

    // Get form values and validate
    const formValues = form.getValues();
    if (!formValues.discordId || !formValues.userName || !formValues.avatarUrl) {
      return false;
    }
    
    // Submit data
    const [error, _] = await tryAsync(
      saveDiscordInfoMutation.mutateAsync({
        discordId: formValues.discordId,
        userName: formValues.userName,
        avatarUrl: formValues.avatarUrl,
      })
    );
    
    if (error !== undefined) {
      toast.error(error.message || "An unexpected error occurred. Please try again.");
      return false;
    }
    
    toast.success("Discord information saved successfully!");
    return true;
  };

  return {
    form,
    saveDiscordInfo,
  };
}
