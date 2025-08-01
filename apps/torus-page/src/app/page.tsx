import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import Image from "next/image";
import * as React from "react";
import { TorusAnimation } from "./_components/torus-animation";
import { env } from "~/env";

export const metadata = createSeoMetadata({
  title: "Torus Network - Decentralized Infrastructure",
  description: "Torus Network is a decentralized infrastructure platform built on Substrate. Explore the future of blockchain technology and decentralized applications.",
  keywords: ["torus network", "decentralized infrastructure", "substrate blockchain", "web3 platform", "blockchain network"],
  ogSiteName: "Torus Network",
  canonical: "/",
  baseUrl: env("BASE_URL"),
});

export default function Page() {
  return (
    <main className="-z-40">
      <div
        className="animate-fade animate-delay-700 absolute top-0 h-full w-full"
        style={{ overflow: "hidden" }}
      >
        <TorusAnimation />
      </div>
      <div className="animate-fade z-20 flex min-h-screen w-full flex-col items-center justify-center">
        <Image
          priority
          alt="Torus"
          width={1000}
          height={1000}
          src="/asci-text.svg"
          className="animate-fade animate-delay-[1000ms] pointer-events-none hidden select-none px-6
            md:block lg:w-[85vh]"
        />
      </div>
    </main>
  );
}
