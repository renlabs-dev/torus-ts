"use client";

import { useAccounts } from "@hyperlane-xyz/widgets";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@torus-ts/ui/components/card";
import { config } from "~/consts/config";
import {
  getIndexForToken,
  getIndexForTokenByChainName,
  useWarpCore,
} from "~/hooks/token";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { logger } from "~/utils/logger";
import { updateSearchParams } from "~/utils/query-params";
import type { TransferFormValues } from "~/utils/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AmountSection } from "../_sections/amount-section";
import { ButtonSection } from "../_sections/button-section";
import { RecipientSection } from "../_sections/recipient-section";
import { SelectChainSection } from "../_sections/select-chain-section";
import { TokenSection } from "../_sections/token-section";
import { WalletTransactionReview } from "../../shared/wallet-review";
import { TransferFormProvider } from "./transfer-form-context";

const transferFormSchema = z.object({
  origin: z.string().min(1, "Origin chain is required"),
  destination: z.string().min(1, "Destination chain is required"),
  tokenIndex: z.number().or(z.undefined()),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number",
    }),
  recipient: z.string().min(1, "Recipient address is required"),
});

export type TransferFormSchema = z.infer<typeof transferFormSchema>;

export function TransferTokenForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Flag for if form is in input vs review mode
  const [isReview, setIsReview] = useState(false);

  const warpCore = useWarpCore();
  const multiProvider = useMultiProvider();
  const { accounts: _accounts } = useAccounts(
    multiProvider,
    config.addressBlacklist,
  );

  const initialValues = useMemo<TransferFormValues>(() => {
    if (fromParam && toParam) {
      return {
        origin: fromParam,
        destination: toParam,
        tokenIndex: getIndexForTokenByChainName(warpCore, fromParam),
        amount: "",
        recipient: "",
      };
    }

    const firstToken = warpCore.tokens[0];
    const connectedToken = firstToken?.connections?.[0];

    return {
      origin: firstToken?.chainName ?? "",
      destination: connectedToken?.token.chainName ?? "",
      tokenIndex: getIndexForToken(warpCore, firstToken),
      amount: "",
      recipient: "",
    };
  }, [warpCore, fromParam, toParam]);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  const {
    handleSubmit,
    reset,
    formState: { isValidating, isValid, errors },
  } = form;

  const onSubmitForm = (values: TransferFormValues) => {
    logger.debug(
      "Reviewing transfer form values for:",
      values.origin,
      values.destination,
    );
    setIsReview(true);
  };

  useEffect(() => {
    if (
      (!fromParam || !toParam) &&
      (fromParam !== initialValues.origin ||
        toParam !== initialValues.destination)
    ) {
      // Store original values to prevent loops
      const originVal = initialValues.origin;
      const destVal = initialValues.destination;

      // Only update if we have valid values
      if (originVal && destVal) {
        const query = updateSearchParams(searchParams, {
          from: originVal,
          to: destVal,
        });

        // Use replace instead of push to avoid adding to history stack
        router.replace("/?" + query);
      }
    }
  }, [
    fromParam,
    toParam,
    router,
    searchParams,
    initialValues.origin,
    initialValues.destination,
  ]);

  return (
    <TransferFormProvider form={form}>
      <form onSubmit={handleSubmit(onSubmitForm)} className="flex flex-col">
        <div className="flex w-full flex-col gap-4 md:flex-row">
          <Card className="animate-fade flex w-full flex-col gap-4 p-6 md:w-3/5">
            <SelectChainSection isReview={isReview} />
            <div className="mt-3.5 flex items-end justify-between space-x-4">
              <TokenSection isReview={isReview} />
              <AmountSection isReview={isReview} />
            </div>
            <RecipientSection isReview={isReview} />
          </Card>
          <Card className="animate-fade flex w-full flex-col justify-between p-6 md:w-2/5">
            <CardHeader className="px-0 pt-0">Review Transaction</CardHeader>
            <CardContent className="p-0">
              <WalletTransactionReview isReview={isReview} />
            </CardContent>
            <CardFooter className="w-full px-0 pb-0 pt-6">
              <ButtonSection
                resetForm={reset}
                isReview={isReview}
                isValidating={isValidating}
                setIsReview={setIsReview}
                isValid={isValid}
                errors={errors}
              />
            </CardFooter>
          </Card>
        </div>
      </form>
    </TransferFormProvider>
  );
}
