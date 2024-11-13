import Image from "next/image";

import Animation from "./components/animation";
import { Bridge } from "./components/bridge";

export default function Page(): JSX.Element {
  return (
    <>
      <div className="absolute bottom-0 left-0 z-50 m-2 w-fit animate-fade">
        <Bridge />
      </div>

      <div className="z-20 flex min-h-screen w-full animate-fade flex-col items-center justify-center pb-[4.6em]">
        <h1 className="block animate-fade-up text-6xl font-semibold tracking-wide shadow-sm animate-delay-[1000ms] md:hidden">
          Torus
        </h1>
        <Image
          priority
          alt="Torus"
          width={1000}
          height={1000}
          src="/asci-text.svg"
          className="hidden animate-fade-up animate-delay-[1000ms] md:block md:h-[145px] md:w-[550px] lg:h-[170px] lg:w-[650px] 2xl:h-[200px] 2xl:w-[850px]"
        />
        <h3 className="animate-fade-up text-center text-2xl font-medium leading-9 tracking-tight shadow-sm animate-delay-[1200ms] md:text-[1.240rem] lg:text-[1.450rem] 2xl:text-[1.742rem]">
          Peer-to-peer Incentivized coordination network.
        </h3>
      </div>
      <Animation />
    </>
  );
}
