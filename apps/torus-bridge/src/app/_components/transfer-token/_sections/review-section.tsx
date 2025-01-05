import { toWei } from "@hyperlane-xyz/utils";
import { SpinnerIcon } from "@hyperlane-xyz/widgets";
import { useFormikContext } from "formik";
import { useIsApproveRequired } from "~/hooks/token/use-is-approve-required";
import { useWarpCore, getTokenByIndex } from "~/hooks/token";
import type { TransferFormValues } from "~/utils/types";
import { useFeeQuotes } from "~/hooks/use-fee-quotes";

export function ReviewSection({ visible }: { visible: boolean }) {
  const { values } = useFormikContext<TransferFormValues>();
  const { amount, destination, tokenIndex } = values;
  const warpCore = useWarpCore();
  const originToken = getTokenByIndex(warpCore, tokenIndex);
  const originTokenSymbol = originToken?.symbol ?? "";
  const connection = originToken?.getConnectionForChain(destination);
  const destinationToken = connection?.token;
  const isNft = originToken?.isNft();

  const amountWei = isNft
    ? amount.toString()
    : toWei(amount, originToken?.decimals);

  const { isLoading: isApproveLoading, isApproveRequired } =
    useIsApproveRequired(originToken, amountWei, visible);
  const { isLoading: isQuoteLoading, fees } = useFeeQuotes(values, visible);

  const isLoading = isApproveLoading || isQuoteLoading;

  return (
    <div
      className={`${
        visible ? "max-h-screen duration-1000 ease-in" : "max-h-0 duration-500"
      } overflow-hidden transition-all`}
    >
      <label className="mt-4 block pl-0.5 text-sm text-gray-600">
        Transactions
      </label>
      <div className="bg-gray-150 mt-1.5 space-y-2 break-all rounded border border-gray-400 px-2.5 py-2 text-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <SpinnerIcon className="h-5 w-5" />
          </div>
        ) : (
          <>
            {isApproveRequired && (
              <div>
                <h4>Transaction 1: Approve Transfer</h4>
                <div className="ml-1.5 mt-1.5 space-y-1.5 border-l border-gray-300 pl-2 text-xs">
                  <p>{`Router Address: ${originToken?.addressOrDenom}`}</p>
                  {originToken?.collateralAddressOrDenom && (
                    <p>{`Collateral Address: ${originToken.collateralAddressOrDenom}`}</p>
                  )}
                </div>
              </div>
            )}
            <div>
              <h4>{`Transaction${isApproveRequired ? " 2" : ""}: Transfer Remote`}</h4>
              <div className="ml-1.5 mt-1.5 space-y-1.5 border-l border-gray-300 pl-2 text-xs">
                {destinationToken?.addressOrDenom && (
                  <p className="flex">
                    <span className="min-w-[6.5rem]">Remote Token</span>
                    <span>{destinationToken.addressOrDenom}</span>
                  </p>
                )}
                <p className="flex">
                  <span className="min-w-[6.5rem]">
                    {isNft ? "Token ID" : "Amount"}
                  </span>
                  <span>{`${amount} ${originTokenSymbol}`}</span>
                </p>
                {fees?.localQuote && fees.localQuote.amount > 0n && (
                  <p className="flex">
                    <span className="min-w-[6.5rem]">Local Gas (est.)</span>
                    <span>{`${fees.localQuote.getDecimalFormattedAmount().toFixed(4) || "0"} ${
                      fees.localQuote.token.symbol || ""
                    }`}</span>
                  </p>
                )}
                {fees?.interchainQuote && fees.interchainQuote.amount > 0n && (
                  <p className="flex">
                    <span className="min-w-[6.5rem]">Interchain Gas</span>
                    <span>{`${fees.interchainQuote.getDecimalFormattedAmount().toFixed(4) || "0"} ${
                      fees.interchainQuote.token.symbol || ""
                    }`}</span>
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
