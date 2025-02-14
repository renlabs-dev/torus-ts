import { TorusObject } from "./components/torus";
import Image from "next/image";

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
