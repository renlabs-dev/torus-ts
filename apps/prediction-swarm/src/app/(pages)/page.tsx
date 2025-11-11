import { Jacquard_12 as Jacquard } from "next/font/google";
import Dither from "../_components/dither";
import { FAQ } from "../_components/main-page/faq";
import { ListItem } from "../_components/main-page/list-item";
import { SearchProphet } from "../_components/main-page/search-prophet";
import { NavigationItems } from "../_components/navigation-items";

export const jacquard = Jacquard({
  weight: "400",
});

export default function Page() {
  return (
    <div>
      <div className="2 absolute right-2 top-2 z-50 opacity-70">
        <NavigationItems />
      </div>
      {/* Mobile Layout */}
      <div className="relative min-h-[90vh] md:hidden">
        <div className="animate-fade absolute inset-0">
          <Dither
            pixelSize={1}
            waveSpeed={0.02}
            waveFrequency={4}
            waveAmplitude={0.3}
            mouseRadius={0.2}
          />
        </div>

        <div className="relative z-10 flex min-h-[100vh] flex-col sm:min-h-[90vh]">
          {/* Centered title */}
          <div className="pointer-events-none flex flex-1 items-center justify-center">
            <h3
              className={`bg-gradient-to-b from-white to-gray-600 bg-clip-text text-center text-8xl font-normal leading-none text-transparent opacity-40 ${jacquard.className}`}
            >
              <span>Prediction</span>
              <br />
              <span>Swarm</span>
            </h3>
          </div>

          {/* Search at bottom */}
          <div className="pointer-events-none pb-12">
            <div className="animate-fade-up animate-delay-[100ms] pointer-events-auto px-4">
              <SearchProphet />
            </div>
          </div>
        </div>

        {/* List items below viewport on mobile */}
        <div className="pointer-events-auto mx-auto grid max-w-6xl gap-6 px-4 pb-6 md:pb-12">
          <ListItem
            title="Prophets"
            description="Discover the most accurate predictors in the swarm"
            linkText="Explore profiles"
            href="/top-predictors"
            className="animate-fade-up animate-delay-[500ms] duration-1000"
          />
          <ListItem
            title="Tickers"
            description="View live predictions across all active tickers in the swarm"
            linkText="Explore Tickers"
            href="/tickers"
            className="animate-fade-up animate-delay-[750ms] duration-1000"
          />
          <ListItem
            title="Predictor Feed"
            description="Track the newest activity from all predictors in the swarm"
            linkText="Explore feed"
            href="/feed"
            className="animate-fade-up animate-delay-[1000ms] duration-1000"
          />
        </div>
      </div>

      {/* Desktop Layout - Original */}
      <div className="relative hidden min-h-[90vh] flex-col md:flex">
        <div className="animate-fade absolute inset-0">
          <Dither
            pixelSize={1}
            waveSpeed={0.02}
            waveFrequency={4}
            waveAmplitude={0.3}
            mouseRadius={0.2}
          />
        </div>

        {/* Centered title */}
        <div className="pointer-events-none relative z-10 mt-40 flex flex-1 items-center justify-center">
          <h3
            className={`bg-gradient-to-b from-white to-gray-600 bg-clip-text text-center text-[10rem] font-normal leading-tight text-transparent opacity-40 ${jacquard.className}`}
          >
            Prediction Swarm
          </h3>
        </div>

        {/* Search and list items at bottom */}
        <div className="pointer-events-none relative z-10 mx-auto w-full pb-12">
          <div className="animate-fade-up animate-delay-[100ms] pointer-events-auto mb-14">
            <SearchProphet />
          </div>
          <div className="pointer-events-auto mx-auto -mb-[6.125rem] grid max-w-6xl gap-6 md:grid-cols-3">
            <ListItem
              title="Prophets"
              description="Discover the most accurate predictors in the swarm"
              linkText="Explore profiles"
              href="/top-predictors"
              className="animate-fade-up animate-delay-[500ms] duration-1000"
            />
            <ListItem
              title="Tickers"
              description="View live predictions across all active tickers in the swarm"
              linkText="Explore Tickers"
              href="/tickers"
              className="animate-fade-up animate-delay-[750ms] duration-1000"
            />
            <ListItem
              title="Predictor Feed"
              description="Track the newest activity from all predictors in the swarm"
              linkText="Explore feed"
              href="/feed"
              className="animate-fade-up animate-delay-[1000ms] duration-1000"
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
