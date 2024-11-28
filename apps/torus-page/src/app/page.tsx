import Image from "next/image";

import { TorusObject } from "./components/torus";

export default function Page(): JSX.Element {
  return (
    <>
      <div
        className="opacity-60s absolute top-0 h-full w-full animate-fade animate-delay-700"
        style={{ overflow: "hidden" }}
      >
        <TorusObject />
      </div>
      <div className="z-20 flex min-h-screen w-full animate-fade flex-col items-center justify-center">
        {/* <h1 className="block animate-fade-up text-6xl font-semibold tracking-wide shadow-sm animate-delay-[1000ms] md:hidden">
          Torus
        </h1> */}
        <Image
          priority
          alt="Torus"
          width={1000}
          height={1000}
          src="/asci-text.svg"
          className="hidden animate-fade-up animate-delay-[1000ms] md:block md:h-[145px] md:w-[550px] lg:h-[170px] lg:w-[650px] 2xl:h-[350px] 2xl:w-[950px]"
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
