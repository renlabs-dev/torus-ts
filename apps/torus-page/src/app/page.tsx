import type { Metadata } from "next";
import { Suspense } from "react";

import { Loading } from "@torus-ts/ui/loading";

import { MainSection } from "./components/sections/main-section";

export const metadata: Metadata = {
  robots: "all",
  title: "torus AI",
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "Making decentralized AI for everyone",
};

export default function Page(): JSX.Element {
  return (
    <Suspense fallback={<Loading />}>
      <MainSection />
    </Suspense>
  );
}
