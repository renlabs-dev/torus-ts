import type { Metadata } from "next";
import { Suspense } from "react";

import { Loading } from "@commune-ts/ui/loading";

import { Wallet } from "./components/sections/wallet";

export const metadata: Metadata = {
  robots: "all",
  title: "Commune Wallet",
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description:
    "Simple, secure, and easy-to-use wallet for the Commune ecosystem.",
};

export default function Page(): JSX.Element {
  return (
    <Suspense fallback={<Loading />}>
      <Wallet />
    </Suspense>
  );
}
