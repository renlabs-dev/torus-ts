"use client";

import { useAccounts } from "@hyperlane-xyz/widgets";
import { Formik, Form } from "formik";
import { useMemo, useState } from "react";
import { config } from "~/consts/config";

import { getIndexForToken, useWarpCore } from "~/hooks/token";
import type { TransferFormValues } from "~/utils/types";
import { logger } from "~/utils/logger";
import { validateForm } from "./validate-form";

import { SelectChainSection } from "../_sections/select-chain-section";
import { AmountSection } from "../_sections/amount-section";
import { RecipientSection } from "../_sections/recipient-section";
import { ButtonSection } from "../_sections/button-section";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { Card, CardContent, CardFooter, CardHeader } from "@torus-ts/ui";
import { WalletTransactionReview } from "../../shared/wallet-review";
import { TokenSection } from "../_sections/token-section";

function useFormInitialValues(): TransferFormValues {
  const warpCore = useWarpCore();
  return useMemo(() => {
    const firstToken = warpCore.tokens[0];
    const connectedToken = firstToken?.connections?.[0];
    console.log(firstToken, connectedToken);
    return {
      origin: firstToken?.chainName ?? "",
      destination: connectedToken?.token.chainName ?? "",
      tokenIndex: getIndexForToken(warpCore, firstToken),
      amount: "",
      recipient: "",
    };
  }, [warpCore]);
}

export function TransferTokenForm() {
  const multiProvider = useMultiProvider();
  const warpCore = useWarpCore();

  const initialValues = useFormInitialValues();
  console.log(initialValues, "initialValues");
  const { accounts } = useAccounts(multiProvider, config.addressBlacklist);

  // Flag for if form is in input vs review mode
  const [isReview, setIsReview] = useState(false);

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

  return (
    <Formik<TransferFormValues>
      initialValues={initialValues}
      onSubmit={onSubmitForm}
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
