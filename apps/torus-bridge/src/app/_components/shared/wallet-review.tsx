import { toWei } from "@hyperlane-xyz/utils";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { Loading } from "@torus-ts/ui/components/loading";
import { useFormikContext } from "formik";
import * as wagmi from "wagmi";
import { getTokenByIndex, useWarpCore } from "~/hooks/token";
import { useIsApproveRequired } from "~/hooks/token/use-is-approve-required";
import { useFeeQuotes } from "~/hooks/use-fee-quotes";
import { getChainValuesOnEnv } from "~/config";
import { env } from "~/env";
import type { TransferFormValues } from "~/utils/types";

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

export function WalletTransactionReview({
  isReview,
}: Readonly<{ isReview: boolean }>) {
  const { values } = useFormikContext<TransferFormValues>();
  const { amount, destination, tokenIndex, origin } = values;
  const warpCore = useWarpCore();
  const originToken = getTokenByIndex(warpCore, tokenIndex);
  const originTokenSymbol = originToken?.symbol ?? "";
  const connection = originToken?.getConnectionForChain(destination);
  const destinationToken = connection?.token;

  const amountWei = toWei(amount, originToken?.decimals);

  const { isLoading: isApproveLoading, isApproveRequired } =
    useIsApproveRequired(originToken, amountWei, isReview);
  const { isLoading: isQuoteLoading, fees } = useFeeQuotes(values, isReview);

  const { address: evmAddress } = wagmi.useAccount();
  const getChainValues = getChainValuesOnEnv(env("NEXT_PUBLIC_TORUS_CHAIN_ENV"));
  const { chainId: baseChainId } = getChainValues("base");
  
  const { data: baseEthBalance, isLoading: isBaseEthLoading } = wagmi.useBalance({
    address: evmAddress,
    chainId: baseChainId,
    query: { enabled: isReview && (origin === "base" || destination === "base") },
  });

  const estimatedGasWei = fees?.interchainQuote ? fees.interchainQuote.amount : 0n;
  const hasInsufficientBaseEth = 
    origin === "base" && 
    baseEthBalance && 
    estimatedGasWei > 0n && 
    baseEthBalance.value < estimatedGasWei;

  const isLoading = isApproveLoading || isQuoteLoading || isBaseEthLoading;

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

            {/* Show Base ETH balance when bridging from Base */}
            {origin === "base" && baseEthBalance && (
              <div className="border-t border-border pt-2 mt-2">
                <ItemText
                  label="Base ETH Balance"
                  value={`${Number(baseEthBalance.formatted).toFixed(6)} ETH`}
                />
                {estimatedGasWei > 0n && (
                  <ItemText
                    label="Estimated Gas"
                    value={`${Number(estimatedGasWei) / 1e18} ETH`}
                  />
                )}
                {hasInsufficientBaseEth && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ Insufficient ETH for gas fees
                  </p>
                )}
              </div>
            )}

            {/* Show Base ETH balance when bridging to Base */}
            {destination === "base" && baseEthBalance && (
              <div className="border-t border-border pt-2 mt-2">
                <ItemText
                  label="Base ETH Balance"
                  value={`${Number(baseEthBalance.formatted).toFixed(6)} ETH`}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
