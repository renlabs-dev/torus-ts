import Animation from "./components/animation";

export default function Page(): JSX.Element {
  return (
    <>
      <div className="z-20 flex min-h-screen w-full animate-fade flex-col items-center justify-center pb-[4.6em]">
        <h1 className="animate-fade-up text-9xl font-thin tracking-wide shadow-sm animate-delay-[1000ms]">
          Torus
        </h1>
        <h3 className="animate-fade-up leading-9 tracking-tight shadow-sm animate-delay-[1200ms] md:text-[1.675rem]">
          Peer-to-peer Incentivized coordination network.
        </h3>
      </div>
      <Animation />
    </>
  );
}
