import { useEffect, useState } from "react";

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";

import { queryExtFee } from "@torus-network/sdk/chain";

/**
 * Output interface for the useTransactionFee hook.
 */
export interface UseTransactionFeeOutput {
  fee: bigint | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for estimating transaction fees.
 *
 * @param tx - The transaction to estimate fees for
 * @param account - The account address that would send the transaction
 * @param api - Polkadot API instance
 * @param options - Optional configuration
 * @returns Fee estimation data with loading and error states
 */
export function useTransactionFee(
  tx: SubmittableExtrinsic<"promise"> | null,
  account: string | null,
  api: ApiPromise | null,
  options?: { enabled?: boolean },
): UseTransactionFeeOutput {
  const [fee, setFee] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tx || !account || !api || options?.enabled === false) {
      setFee(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const estimateFee = async () => {
      setIsLoading(true);
      setError(null);

      const [queryError, result] = await queryExtFee(tx, account);

      if (queryError !== undefined) {
        setError(queryError);
        setFee(null);
      } else {
        setFee(result.fee);
        setError(null);
      }

      setIsLoading(false);
    };

    void estimateFee();
  }, [tx, account, api, options?.enabled]);

  return { fee, isLoading, error };
}
