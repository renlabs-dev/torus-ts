"use client";

import { useForm } from "react-hook-form";
import { FaucetForm } from "./faucet-form";
import type { FaucetFormValues } from "./faucet-form-schema";
import { FaucetFormSchema } from "./faucet-form-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "~/context/wallet-provider";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useState } from "react";
import { useTorus } from "@torus-ts/torus-provider";
import { callFaucetExtrinsic, doWork } from "~/utils/faucet";
import type { ApiPromise } from "@polkadot/api";

export function Faucet() {
  const { api } = useTorus();
  const { toast } = useToast();
  const { selectedAccount, accountFreeBalance } = useWallet();

  const [ isLoading, setLoading ] = useState<boolean>(false);
  const [ loadMessage, setLoadMessage ] = useState<string>("");

  const form = useForm<FaucetFormValues>({
    resolver: zodResolver(FaucetFormSchema),
    defaultValues: {
      recipient: selectedAccount?.address ?? "",
    },
    mode: "onTouched",
  });

  const submit = async (requiredRuns: number) => {
    const [error, isValid] = await tryAsync(form.trigger());
    if (error !== undefined) {
      toast.error(error.message);
      return;
    }

    if (!isValid) {
      return;
    }

    const recipient = form.getValues().recipient;
    for (let index = 0; index < requiredRuns; index++) {
      const remaining = requiredRuns - (index + 1);

      setLoadMessage("Working..."   + (remaining > 0 ? ` (${remaining} remaining)` : ""));
      setLoading(true);
      const workResult = await doWork(api as unknown as ApiPromise, recipient);

      setLoadMessage("Requesting..." + (remaining > 0 ? ` (${remaining} remaining)` : ""));
      try {
        await callFaucetExtrinsic(api as unknown as ApiPromise, workResult, recipient);
        toast.success("+50 TOR added to your account.")
        await accountFreeBalance.refetch();      
      } catch(err) {
        if(err instanceof Error) {
          toast.error(err.message);
        } else {
          toast.error("Something went wrong, try again later.");
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <FaucetForm
        form={form}
        selectedAccount={selectedAccount}
        isLoading={isLoading}
        loadMessage={loadMessage}
        onSubmit={submit}
      />
    </div>
  );
}
