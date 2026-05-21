import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { torusEvm } from "~/lib/chain";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";

export type ScwState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "eoa" }
  | { status: "scw" }
  | { status: "error"; error: Error };

export function useIsScw(address: `0x${string}` | undefined): ScwState {
  const publicClient = usePublicClient({ chainId: torusEvm.id });
  const [state, setState] = useState<ScwState>({ status: "idle" });

  useEffect(() => {
    if (address === undefined || publicClient === undefined) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "loading" });

    void (async () => {
      const [error, bytecode] = await tryAsync(
        publicClient.getCode({ address }),
      );

      if (error !== undefined) {
        setState({ status: "error", error });
        return;
      }

      if (bytecode !== undefined && bytecode !== "0x" && bytecode.length > 2) {
        setState({ status: "scw" });
      } else {
        setState({ status: "eoa" });
      }
    })();
  }, [address, publicClient]);

  return state;
}
