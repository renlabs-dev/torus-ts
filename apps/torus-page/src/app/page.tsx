import Image from "next/image";

import { TorusObject } from "./components/torus";

export default function Page(): JSX.Element {
  return (
    <main className="-z-40">
      <div
        className="absolute top-0 h-full w-full animate-fade animate-delay-700"
        style={{ overflow: "hidden" }}
      >
        <TorusObject />
      </div>
      <div className="z-20 flex min-h-screen w-full animate-fade flex-col items-center justify-center">
        {/* <h1 className="block animate-fade-up text-7xl font-semibold tracking-wide shadow-sm animate-delay-[1000ms] md:hidden">
          Torus
        </h1> */}
        <Image
          priority
          alt="Torus"
          width={1000}
          height={1000}
          src="/asci-text.svg"
          className="pointer-events-none hidden animate-fade select-none px-6 animate-delay-[1000ms] md:block lg:w-[85vh]"
        />
      </div>
    </main>
  );
}
