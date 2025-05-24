"use client";

import { useForm } from "react-hook-form";
import { FaucetForm } from "./faucet-form";
import type { FaucetFormValues } from "./faucet-form-schema";
import { FaucetFormSchema } from "./faucet-form-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "~/context/wallet-provider";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { performFaucet, performFirstFaucet } from "./faucet-form-handler";
import { useEffect, useState } from "react";
import { checkSS58 } from "@torus-network/sdk";
import { useTorus } from "@torus-ts/torus-provider";

export function Faucet() {
  const { api } = useTorus();
  const { toast } = useToast();
  const { selectedAccount, accountFreeBalance } = useWallet();
  const [token, setToken] = useState<string | null>(null);

  const form = useForm<FaucetFormValues>({
    resolver: zodResolver(FaucetFormSchema),
    defaultValues: {
      recipient: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    if (selectedAccount) {
      try {
        form.setValue("recipient", checkSS58(selectedAccount.address));
      } catch (e) {
        console.error(e);
      }
    }
  }, [selectedAccount, form]);

  const submit = async () => {
    console.log("clicked");
    const [error, isValid] = await tryAsync(form.trigger());
    if (error !== undefined) {
      console.log("error triggering");
      toast.error(error.message);
      return;
    }

    console.log("no error triggering");

    if (!isValid) {
      console.log("invalid");
      return;
    }

    const balance = accountFreeBalance.data ?? 0;
    const isFirstFaucet = balance < 0.000001;
    const recipient = form.getValues().recipient;

    if (api !== null) {
      console.log("api not null");
      if (isFirstFaucet) {
        console.log("first faucet");
        if (token === null) {
          console.log("captcha required");
          toast.error("Captcha is required.");
          return;
        }
        console.log("perform first");
        await performFirstFaucet(api, recipient, token);
      } else {
        console.log("perform");
        await performFaucet(api, recipient);
      }
    } else {
      console.log("api is null");
      throw new Error("api is null");
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <FaucetForm
        form={form}
        selectedAccount={selectedAccount}
        setToken={setToken}
        onSubmit={submit}
      />
    </div>
  );
}
