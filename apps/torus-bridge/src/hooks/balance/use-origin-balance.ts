import { useAccountAddressForChain } from "@hyperlane-xyz/widgets";

import type { TransferFormValues } from "~/utils/types";

import { useTokenByIndex } from "../token";
import { useMultiProvider } from "../use-multi-provider";
import { useBalance } from "./use-balance";

export function useOriginBalance({ origin, tokenIndex }: TransferFormValues) {
  const multiProvider = useMultiProvider();
  const address = useAccountAddressForChain(multiProvider, origin);
  const token = useTokenByIndex(tokenIndex);
  return useBalance(origin, token, address);
}
