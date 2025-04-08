import type { TransferFormValues } from "~/utils/types";
import { useTokenByIndex } from "../token";
import { useBalance } from "./use-balance";

export function useDestinationBalance({
  destination,
  tokenIndex,
  recipient,
}: TransferFormValues) {
  const originToken = useTokenByIndex(tokenIndex);
  const connection = originToken?.getConnectionForChain(destination);
  return useBalance(destination, connection?.token, recipient);
}
