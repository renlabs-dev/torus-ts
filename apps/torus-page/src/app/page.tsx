import Animation from "./components/animation";

export default function Page(): JSX.Element {
  return (
    <>
      <div className="z-20 flex min-h-screen w-full animate-fade flex-col items-center justify-center pb-[4.6em]">
        {/* <h1 className="animate-fade-up text-9xl font-thin tracking-wide shadow-sm animate-delay-[1000ms]">
          Torus
        </h1> */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/text-asci.svg"
          alt="Torus"
          className="h-[200px] w-[850px] animate-fade-up animate-delay-[1100ms]"
        />
        <h3 className="animate-fade-up leading-9 tracking-tight shadow-sm animate-delay-[1200ms] md:text-[1.750rem]">
          Peer-to-peer Incentivized coordination network.
        </h3>
      </div>
      <Animation />
    </>
  );
}
