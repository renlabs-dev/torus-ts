import { toWei } from "@hyperlane-xyz/utils";
import { Loading } from "@torus-ts/ui/components/loading";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { useFormikContext } from "formik";
import React from "react";
import { useWarpCore, getTokenByIndex } from "~/hooks/token";
import { useIsApproveRequired } from "~/hooks/token/use-is-approve-required";
import { useFeeQuotes } from "~/hooks/use-fee-quotes";
import type { TransferFormValues } from "~/utils/types";

export function WalletTransactionReview({
  isReview,
}: Readonly<{ isReview: boolean }>) {
  const { values } = useFormikContext<TransferFormValues>();
  const { amount, destination, tokenIndex } = values;
  const warpCore = useWarpCore();
  const originToken = getTokenByIndex(warpCore, tokenIndex);
  const originTokenSymbol = originToken?.symbol ?? "";
  const connection = originToken?.getConnectionForChain(destination);
  const destinationToken = connection?.token;

  const amountWei = toWei(amount, originToken?.decimals);

  const { isLoading: isApproveLoading, isApproveRequired } =
    useIsApproveRequired(originToken, amountWei, isReview);
  const { isLoading: isQuoteLoading, fees } = useFeeQuotes(values, isReview);

  const isLoading = isApproveLoading || isQuoteLoading;
  return (
    <div className="break-all text-sm">
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {isApproveRequired && (
            <div className="border-border mb-2 flex flex-col gap-2 border-b pb-2">
              <ItemText label="Transaction 1" value="Transfer Remote" />
              <div>
                {originToken?.addressOrDenom && (
                  <ItemText
                    label="Remote Token"
                    value={smallAddress(originToken.addressOrDenom)}
                  />
                )}
                {originToken?.collateralAddressOrDenom && (
                  <ItemText
                    label="Collateral Address"
                    value={smallAddress(originToken.collateralAddressOrDenom)}
                  />
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <ItemText
              label={`Transaction${isApproveRequired ? " 2" : ""}`}
              value="Transfer Remote"
            />

            {destinationToken?.addressOrDenom && (
              <ItemText
                label="Remote Token"
                value={smallAddress(destinationToken.addressOrDenom)}
              />
            )}
            <ItemText
              label="Amount"
              value={`${Number(amount) > 0 ? amount : 0} ${originTokenSymbol}`}
            />

            {fees?.interchainQuote && fees.interchainQuote.amount > 0n && (
              <p className="flex w-full justify-between">
                <span className="min-w-[6.5rem]">Interchain Gas</span>
                <span>{`${fees.interchainQuote.getDecimalFormattedAmount().toFixed(4) || "0"} ${
                  fees.interchainQuote.token.symbol || ""
                }`}</span>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ItemText({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <p className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </p>
  );
}
