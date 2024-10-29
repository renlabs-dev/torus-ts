import { Button } from "@torus-ts/ui";

import Animation from "./components/animation";

export default function Page(): JSX.Element {
  return (
    <div
      className={`mx-auto flex min-h-[100svh] max-w-screen-2xl animate-fade flex-col transition duration-700 animate-delay-700`}
    >
      <div className="flex-grow">
        <Animation />
      </div>

      <div className="flex items-end justify-between px-4 pb-8">
        <p className="animate-fade-up font-medium animate-delay-1000 md:text-xl">
          <span className="text-purple-400">Peer-to-peer </span>
          Incentivized coordination network.
        </p>

        <Button variant="link" className="text-lg">
          View More
        </Button>
      </div>
    </div>
  );
}
