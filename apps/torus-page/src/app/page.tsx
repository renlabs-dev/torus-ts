import { Icons } from "node_modules/@torus-ts/ui/src/components/icons";

import Animation from "./components/animation";

export default function Page(): JSX.Element {
  return (
    <>
      <div className="z-20 flex min-h-screen w-full animate-fade flex-col items-center justify-center pb-[4.6em]">
        <h1 className="block animate-fade-up text-6xl font-semibold tracking-wide shadow-sm animate-delay-[1000ms] md:hidden">
          Torus
        </h1>
        <Icons.textAsci className="hidden animate-fade-up animate-delay-[1000ms] md:block md:h-[145px] md:w-[550px] lg:h-[170px] lg:w-[650px] 2xl:h-[200px] 2xl:w-[850px]" />
        <h3 className="animate-fade-up text-center text-2xl font-medium leading-9 tracking-tight shadow-sm animate-delay-[1200ms] md:text-[1.240rem] lg:text-[1.450rem] 2xl:text-[1.742rem]">
          Peer-to-peer Incentivized coordination network.
        </h3>
      </div>
      <Animation />
    </>
  );
}
