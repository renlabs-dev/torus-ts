import Image from "next/image";
import * as React from "react";
import { TorusAnimation } from "./_components/torus-animation";

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
          className="animate-fade animate-delay-[1000ms] pointer-events-none hidden select-none px-6 md:block lg:w-[85vh]"
        />
      </div>
    </main>
  );
}
