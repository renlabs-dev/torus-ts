"use client";

import { useAccounts } from "@hyperlane-xyz/widgets";
import { Formik, Form } from "formik";
import { useMemo, useState } from "react";
import { config } from "~/consts/config";

import { getIndexForToken, useWarpCore } from "~/features/tokens/hooks";
import type { TransferFormValues } from "~/utils/types";
import { logger } from "~/utils/logger";
import { validateForm } from "./validate-form";
import { WarningBanners } from "./warning-banner";

import { SelectChainSection } from "../_sections/select-chain-section";
import { TokenSection } from "../_sections/token-section";
import { AmountSection } from "../_sections/amount-section";
import { RecipientSection } from "../_sections/recipient-section";
import { ReviewSection } from "../_sections/review-section";
import { ButtonSection } from "../_sections/button-section";
import { useMultiProvider } from "~/hooks/use-multi-provider";

function useFormInitialValues(): TransferFormValues {
  const warpCore = useWarpCore();
  return useMemo(() => {
    const firstToken = warpCore.tokens[0];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const connectedToken = firstToken!.connections?.[0];
    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      origin: firstToken!.chainName,
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
  const { accounts } = useAccounts(multiProvider, config.addressBlacklist);

  // Flag for if form is in input vs review mode
  const [isReview, setIsReview] = useState(false);
  // Flag for check current type of token
  const [isNft, setIsNft] = useState(false);

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
      {({ isValidating }) => (
        <Form className="flex w-full flex-col items-stretch">
          <WarningBanners />
          <SelectChainSection isReview={isReview} />
          <div className="mt-3.5 flex items-end justify-between space-x-4">
            <TokenSection setIsNft={setIsNft} isReview={isReview} />
            <AmountSection isNft={isNft} isReview={isReview} />
          </div>
          <RecipientSection isReview={isReview} />
          <ReviewSection visible={isReview} />
          <ButtonSection
            isReview={isReview}
            isValidating={isValidating}
            setIsReview={setIsReview}
          />
        </Form>
      )}
    </Formik>
  );
}
