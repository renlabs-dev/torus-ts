"use client";

import { useAccounts } from "@hyperlane-xyz/widgets";
import { Card, CardContent, CardFooter, CardHeader } from "@torus-ts/ui";
import { Form,Formik } from "formik";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

import { WalletTransactionReview } from "../../shared/wallet-review";
import { AmountSection } from "../_sections/amount-section";
import { ButtonSection } from "../_sections/button-section";
import { RecipientSection } from "../_sections/recipient-section";
import { SelectChainSection } from "../_sections/select-chain-section";
import { TokenSection } from "../_sections/token-section";
import { validateForm } from "./validate-form";

export function TransferTokenForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Flag for if form is in input vs review mode
  const [isReview, setIsReview] = useState(false);

  const warpCore = useWarpCore();
  const multiProvider = useMultiProvider();
  const { accounts } = useAccounts(multiProvider, config.addressBlacklist);

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

  const validate = (values: TransferFormValues) =>
    validateForm(warpCore, values, accounts);

  const onSubmitForm = (values: TransferFormValues) => {
    logger.debug(
      "Reviewing transfer form values for:",
      values.origin,
      values.destination,
    );
    setIsReview(true);
  };

  useEffect(() => {
    if (!fromParam || !toParam) {
      const query = updateSearchParams(searchParams, {
        from: initialValues.origin,
        to: initialValues.destination,
      });
      router.push("/?" + query);
    }
  }, [
    fromParam,
    initialValues.destination,
    initialValues.origin,
    router,
    searchParams,
    toParam,
  ]);

  return (
    <Formik<TransferFormValues>
      initialValues={initialValues}
      onSubmit={onSubmitForm}
      enableReinitialize
      validate={validate}
      validateOnChange={false}
      validateOnBlur={false}
    >
      {({ isValidating, resetForm }) => (
        <Form className="flex flex-col">
          <div className="flex w-full flex-col gap-4 md:flex-row">
            <Card className="flex w-full animate-fade flex-col gap-4 p-6 md:w-3/5">
              <SelectChainSection isReview={isReview} />
              <div className="mt-3.5 flex items-end justify-between space-x-4">
                <TokenSection isReview={isReview} />
                <AmountSection isReview={isReview} />
              </div>
              <RecipientSection isReview={isReview} />
            </Card>
            <Card className="flex w-full animate-fade flex-col justify-between p-6 md:w-2/5">
              <CardHeader className="px-0 pt-0">Review Transaction</CardHeader>
              <CardContent className="p-0">
                <WalletTransactionReview isReview={isReview} />
              </CardContent>
              <CardFooter className="w-full px-0 pb-0 pt-6">
                <ButtonSection
                  resetForm={resetForm}
                  isReview={isReview}
                  isValidating={isValidating}
                  setIsReview={setIsReview}
                />
              </CardFooter>
            </Card>
          </div>
        </Form>
      )}
    </Formik>
  );
}
