import { useMultiProvider } from "../use-multi-provider";
import { eqAddress } from "@hyperlane-xyz/utils";
import { useEthereumAccount } from "@hyperlane-xyz/widgets";
import { useQuery } from "@tanstack/react-query";

const OFAC_SANCTIONED_ADDRESSES_ENDPOINT =
  "https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists/sanctioned_addresses_ETH.json";

export function useIsAccountOfacSanctioned() {
  const multiProvider = useMultiProvider();
  const evmAddress = useEthereumAccount(multiProvider).addresses[0]?.address;

  const sanctionedAddresses = useQuery<string[]>({
    queryKey: ["useIsAccountOfacSanctioned", evmAddress],
    queryFn: () =>
      fetch(OFAC_SANCTIONED_ADDRESSES_ENDPOINT).then((x) => x.json()),
    enabled: !!evmAddress,
  });

  return (
    !!sanctionedAddresses.data &&
    !!evmAddress &&
    !!sanctionedAddresses.data.find((x) => eqAddress(x, evmAddress))
  );
}
