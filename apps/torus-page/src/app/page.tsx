import Image from "next/image";

import { TorusObject } from "./components/torus";

export default function Page(): JSX.Element {
  return (
    <>
      <div
        className="absolute top-0 h-full w-full animate-fade animate-delay-700"
        style={{ overflow: "hidden" }}
      >
        <TorusObject />
      </div>
      <div className="z-20 flex min-h-screen w-full animate-fade flex-col items-center justify-center">
        <h1 className="block animate-fade-up text-7xl font-semibold tracking-wide shadow-sm animate-delay-[1000ms] md:hidden">
          Torus
        </h1>
        <Image
          priority
          alt="Torus"
          width={1000}
          height={1000}
          src="/asci-text.svg"
          className="-z-50 hidden animate-fade px-6 animate-delay-[1000ms] md:block xl:w-[68vh] 2xl:w-[85vh]"
        />
        {/* <Image
          priority
          alt="Torus"
          width={1000}
          height={1000}
          src="/logo.svg"
          className="mb-4 h-[40px] w-[100px] animate-fade-up animate-delay-[1000ms]"
        /> */}
        {/* <h3 className="animate-fade-up text-center text-2xl font-thin leading-9 tracking-tight shadow-sm animate-delay-[1200ms] md:text-[1.240rem] lg:text-[1.450rem] 2xl:text-[1.642rem]">
          Peer-to-peer Incentivized coordination network.
        </h3> */}
      </div>
    </>
  );
}
