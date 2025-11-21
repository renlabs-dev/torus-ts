"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ApiPromise } from "@polkadot/api";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { useTorus } from "@torus-ts/torus-provider";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useWallet } from "~/context/wallet-provider";
import {
  callFaucetExtrinsic,
  doWork,
  InvalidWorkBlockError,
} from "~/utils/faucet";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaucetForm } from "./faucet-form";
import type { FaucetFormValues } from "./faucet-form-schema";
import { FaucetFormSchema } from "./faucet-form-schema";

const MAX_RETRIES = 3;
const FAUCET_AMOUNT = "+50 TORUS";

interface FaucetAttemptResult {
  success: boolean;
  shouldStop: boolean;
}

function getRemainingMessage(remaining: number): string {
  return remaining > 0 ? ` (${remaining} remaining)` : "";
}

async function validateForm(
  triggerValidation: () => Promise<boolean>,
  showError: (message: string) => void,
): Promise<boolean> {
  const [error, isValid] = await tryAsync(triggerValidation());

  if (error !== undefined) {
    showError(error.message);
    return false;
  }

  return isValid;
}

async function executeFaucetRequest(
  api: ApiPromise,
  recipient: string,
  setLoadMessage: (message: string) => void,
  remainingText: string,
): Promise<FaucetAttemptResult> {
  const workResult = await doWork(api, recipient);
  setLoadMessage(`Requesting...${remainingText}`);
  await callFaucetExtrinsic(api, workResult, recipient);
  return { success: true, shouldStop: false };
}

function handleInvalidWorkBlock(
  retryCount: number,
  showError: (message: string) => void,
): FaucetAttemptResult {
  console.log(
    `Block too old, retrying with fresh block (attempt ${retryCount}/${MAX_RETRIES})...`,
  );

  if (retryCount >= MAX_RETRIES) {
    showError(
      "Failed to complete request after multiple attempts. Please try again.",
    );
    return { success: false, shouldStop: true };
  }

  return { success: false, shouldStop: false };
}

function handleGenericError(
  error: unknown,
  showError: (message: string) => void,
): FaucetAttemptResult {
  if (error instanceof Error) {
    showError(error.message);
    return { success: false, shouldStop: true };
  }

  showError("Something went wrong, try again later.");
  console.error(error);
  return { success: false, shouldStop: true };
}

async function attemptFaucetRequest(
  api: ApiPromise,
  recipient: string,
  retryCount: number,
  showError: (message: string) => void,
  setLoadMessage: (message: string) => void,
  remainingText: string,
): Promise<FaucetAttemptResult> {
  try {
    return await executeFaucetRequest(api, recipient, setLoadMessage, remainingText);
  } catch (error) {
    if (error instanceof InvalidWorkBlockError) {
      return handleInvalidWorkBlock(retryCount, showError);
    }

    return handleGenericError(error, showError);
  }
}

async function executeFaucetWithRetry(
  api: ApiPromise,
  recipient: string,
  showError: (message: string) => void,
  showSuccess: (message: string) => void,
  refreshBalance: () => Promise<void>,
  setLoadMessage: (message: string) => void,
  remainingText: string,
): Promise<boolean> {
  for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
    const result = await attemptFaucetRequest(
      api,
      recipient,
      retryCount + 1,
      showError,
      setLoadMessage,
      remainingText,
    );

    if (result.success) {
      showSuccess(`${FAUCET_AMOUNT} added to your account.`);
      await refreshBalance();
      return true;
    }

    if (result.shouldStop) {
      return false;
    }
  }

  return false;
}

async function processFaucetRun(
  api: ApiPromise,
  recipient: string,
  remaining: number,
  setLoadMessage: (message: string) => void,
  showError: (message: string) => void,
  showSuccess: (message: string) => void,
  refreshBalance: () => Promise<void>,
): Promise<boolean> {
  const remainingText = getRemainingMessage(remaining);

  setLoadMessage(`Working...${remainingText}`);

  const success = await executeFaucetWithRetry(
    api,
    recipient,
    showError,
    showSuccess,
    refreshBalance,
    setLoadMessage,
    remainingText,
  );

  return success;
}

export function Faucet() {
  const { api } = useTorus();
  const { toast } = useToast();
  const { selectedAccount, accountFreeBalance } = useWallet();

  const [isLoading, setLoading] = useState<boolean>(false);
  const [loadMessage, setLoadMessage] = useState<string>("");

  const form = useForm<FaucetFormValues>({
    resolver: zodResolver(FaucetFormSchema),
    defaultValues: {
      recipient: selectedAccount?.address ?? "",
    },
    mode: "onTouched",
  });

  const submit = async (requiredRuns: number) => {
    const isValid = await validateForm(
      () => form.trigger(),
      (msg) => toast.error(msg),
    );

    if (!isValid) return;

    const recipient = form.getValues().recipient;

    setLoading(true);

    for (let index = 0; index < requiredRuns; index++) {
      const remaining = requiredRuns - (index + 1);

      const success = await processFaucetRun(
        api as unknown as ApiPromise,
        recipient,
        remaining,
        setLoadMessage,
        (msg) => toast.error(msg),
        (msg) => toast.success(msg),
        async () => {
          await accountFreeBalance.refetch();
        },
      );

      if (!success) break;
    }

    setLoading(false);
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
