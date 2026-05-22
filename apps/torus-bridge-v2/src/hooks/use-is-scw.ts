import { useQuery } from "@tanstack/react-query";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { torusEvm } from "~/lib/chain";
import { assert } from "tsafe";
import { usePublicClient } from "wagmi";

export function useIsScw(address: `0x${string}` | undefined) {
  const publicClient = usePublicClient({ chainId: torusEvm.id });

  return useQuery({
    queryKey: ["isScw", address],
    queryFn: async () => {
      assert(
        publicClient !== undefined,
        "publicClient is required when scw query is enabled",
      );
      assert(
        address !== undefined,
        "address is required when scw query is enabled",
      );
      const [error, bytecode] = await tryAsync(
        publicClient.getCode({ address }),
      );

      if (error !== undefined) throw error;

      return bytecode !== undefined && bytecode !== "0x" && bytecode.length > 2;
    },
    enabled: address !== undefined && publicClient !== undefined,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}
