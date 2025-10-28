import { Jacquard_12 as Jacquard } from "next/font/google";
import Dither from "../_components/dither";
import { FAQ } from "../_components/main-page/faq";
import ListItem from "../_components/main-page/list-item";
import { SearchProphet } from "../_components/main-page/search-prophet";

export const jacquard = Jacquard({
  weight: "400",
});

export default function Page() {
  return (
    <div>
      <div className="relative pt-[22rem]">
        <div className="absolute inset-0 -z-10 bg-white/10">
          <Dither
            pixelSize={1}
            waveSpeed={0.02}
            waveFrequency={4}
            waveAmplitude={0.3}
          />
        </div>
        <h3
          className={`bg-gradient-to-b from-white to-gray-600 bg-clip-text text-center text-4xl font-normal leading-tight text-transparent opacity-40 md:text-[10rem] ${jacquard.className}`}
        >
          Prediction Swarm
        </h3>
        <div className="relative z-20 mx-auto w-full py-24">
          <div className="mb-14">
            <SearchProphet />
          </div>
          <div className="mx-auto -mb-[9.125rem] grid max-w-6xl gap-6 md:grid-cols-3">
            <ListItem
              title="Predictor Profiles"
              description="View detailed profiles of any predictor on the swarm."
              linkText="View profiles"
              href="#faqs"
            />
            <ListItem
              title="Tickers"
              description="View real-time predictions for all tickers on the swarm."
              linkText="View tickers"
              href="#tickers"
            />
            <ListItem
              title="Predictor Feed"
              description="View the latest predictions from all predictors on the swarm."
              linkText="View feed"
              href="/feed"
            />
          </div>
        </div>
      </div>

      <div
        id="faqs"
        className="border-border relative border-t bg-[url(/background.svg)] bg-cover"
      >
        <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-md -translate-x-1/2 border-x" />

        <div className="relative py-16 md:py-32">
          <div className="mx-auto mb-12 w-full max-w-screen-md px-4 text-center">
            <h2 className="text-foreground mb-2 text-2xl font-bold">
              The fractal nature of foresight
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl pb-12">
              From cells to societies, intelligence emerges through nested
              agency. The swarm applies this principle to predictions, mapping
              who to trust and when, turning uncertainty into clarity.
            </p>
          </div>

          <div className="border-border relative border-y py-4">
            <div className="mx-auto w-full max-w-screen-md px-4">
              <FAQ />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
