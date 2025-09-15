"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { useTorus } from "@torus-ts/torus-provider";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useWallet } from "~/context/wallet-provider";
import { callFaucetExtrinsic, doWork } from "~/utils/faucet";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FaucetForm } from "./faucet-form";
import type { FaucetFormValues } from "./faucet-form-schema";
import { FaucetFormSchema } from "./faucet-form-schema";

export function Faucet() {
  const { api } = useTorus();
  const { toast } = useToast();
  const { selectedAccount, accountFreeBalance } = useWallet();

  const [isLoading, setLoading] = useState<boolean>(false);
  const [loadMessage, setLoadMessage] = useState<string>("");
  const cleanupRef = useRef<(() => void) | null>(null);

  // Cleanup workers on component unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  const form = useForm<FaucetFormValues>({
    resolver: zodResolver(FaucetFormSchema),
    defaultValues: {
      recipient: selectedAccount?.address ?? "",
    },
    mode: "onTouched",
  });

  const executeFaucetRequest = async (
    recipient: string,
    currentRun: number,
    totalRuns: number,
    _onProgress?: (message: string) => void,
  ) => {
    if (!api) {
      throw new Error("API not initialized");
    }

    setLoadMessage(
      `Step 1/4: Generating proof of work... (${currentRun}/${totalRuns})`,
    );
    const [workError, workResult] = await tryAsync(
      doWork(api, recipient, (cleanup) => {
        cleanupRef.current = cleanup;
      }),
    );

    if (workError !== undefined) {
      throw new Error(`Failed to generate proof of work: ${workError.message}`);
    }

    setLoadMessage(
      `Step 2/4: Sending transaction... (${currentRun}/${totalRuns})`,
    );
    const [txError] = await tryAsync(
      callFaucetExtrinsic(api, workResult, recipient, (progressMessage) => {
        setLoadMessage(
          `Step 3/4: ${progressMessage} (${currentRun}/${totalRuns})`,
        );
      }),
    );

    if (txError !== undefined) {
      throw new Error(`Failed to send transaction: ${txError.message}`);
    }

    setLoadMessage(
      `Step 4/4: Waiting for confirmation... (${currentRun}/${totalRuns})`,
    );

    // 5s delay to wait for the transaction to be included in a block
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const [refetchError] = await tryAsync(accountFreeBalance.refetch());

    if (refetchError !== undefined) {
      console.warn("Failed to update balance:", refetchError);
    }

    return true;
  };

  const executeAllRequests = async (
    recipient: string,
    requiredRuns: number,
    _onProgress?: (message: string) => void,
  ) => {
    for (let index = 0; index < requiredRuns; index++) {
      const currentRun = index + 1;

      const [executionError] = await tryAsync(
        executeFaucetRequest(recipient, currentRun, requiredRuns, _onProgress),
      );

      if (executionError !== undefined) {
        toast.error(executionError.message);
        break;
      }

      toast.success(
        `+50 TORUS added to your account! (${currentRun}/${requiredRuns})`,
      );
    }
  };

  const submit = async (requiredRuns: number) => {
    const [validationError, isValid] = await tryAsync(form.trigger());
    if (validationError !== undefined) {
      toast.error(`Validation error: ${validationError.message}`);
      return;
    }

    if (!isValid) {
      toast.error("Please fix the form errors");
      return;
    }

    const recipient = form.getValues().recipient;
    setLoading(true);

    const [executionError] = await tryAsync(
      executeAllRequests(recipient, requiredRuns, (progressMessage) => {
        setLoadMessage(progressMessage);
      }),
    );

    if (executionError !== undefined) {
      if (executionError instanceof Error) {
        toast.error(executionError.message);
      } else {
        toast.error("Something went wrong, please try again later");
        console.error("Unexpected error:", executionError);
      }
    }

    setLoading(false);
    setLoadMessage("");
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
