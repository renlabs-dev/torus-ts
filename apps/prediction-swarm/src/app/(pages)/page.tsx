import { Jacquard_12 as Jacquard } from "next/font/google";
import { DitherBackgroundAnimation } from "../_components/dither-background-animation";
import { MainPageExploreItemCard } from "../_components/main-page/main-page-explore-item-card";
import { MainPageFAQ } from "../_components/main-page/main-page-faq";
import { PageNavigationButtons } from "../_components/page-navigation/page-navigation-buttons";
import { SearchPredictorCommandTrigger } from "../_components/search-predictor-command/search-predictor-command-trigger";

export const jacquard = Jacquard({
  weight: "400",
});

export default function Page() {
  return (
    <div>
      <div className="2 absolute right-2 top-2 z-50 opacity-70">
        <PageNavigationButtons />
      </div>
      {/* Mobile Layout */}
      <div className="relative min-h-[90vh] md:hidden">
        <div className="animate-fade absolute inset-0">
          <DitherBackgroundAnimation
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
              className={`bg-gradient-to-b from-white to-gray-600 bg-clip-text text-center text-8xl font-normal leading-none text-transparent opacity-60 ${jacquard.className}`}
            >
              <span>Prediction</span>
              <br />
              <span>Swarm</span>
            </h3>
          </div>

          {/* Search at bottom */}
          <div className="pointer-events-none pb-12">
            <div className="animate-fade-up animate-delay-[100ms] pointer-events-auto px-4">
              <SearchPredictorCommandTrigger />
            </div>
          </div>
        </div>

        {/* List items below viewport on mobile */}
        <div className="pointer-events-auto mx-auto grid max-w-6xl gap-6 px-4 pb-6 md:pb-12">
          <MainPageExploreItemCard
            title="Prophets"
            description="Discover the most accurate predictors in the swarm"
            linkText="Explore profiles"
            href="/top-predictors"
            className="animate-fade-up animate-delay-[500ms] duration-1000"
          />
          <MainPageExploreItemCard
            title="Tickers"
            description="View live predictions across all active tickers in the swarm"
            linkText="Explore Tickers"
            href="/tickers"
            className="animate-fade-up animate-delay-[750ms] duration-1000"
          />
          <MainPageExploreItemCard
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
        <div className="absolute inset-0 opacity-60">
          <DitherBackgroundAnimation
            pixelSize={1}
            waveSpeed={0.01}
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
            <SearchPredictorCommandTrigger />
          </div>
          <div className="pointer-events-auto mx-auto -mb-[6.125rem] grid max-w-6xl gap-6 md:grid-cols-3">
            <MainPageExploreItemCard
              title="Prophets"
              description="Discover the most accurate predictors in the swarm"
              linkText="Explore profiles"
              href="/top-predictors"
              className="animate-fade-up animate-delay-[500ms] duration-1000"
            />
            <MainPageExploreItemCard
              title="Tickers"
              description="View live predictions across all active tickers in the swarm"
              linkText="Explore Tickers"
              href="/tickers"
              className="animate-fade-up animate-delay-[750ms] duration-1000"
            />
            <MainPageExploreItemCard
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
        className="border-border relative border-t bg-[url(/home-bg.svg)] bg-cover"
      >
        <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-md -translate-x-1/2 border-x" />

        <div className="relative py-16 md:py-32">
          <div className="mx-auto mb-12 w-full max-w-screen-md px-4 text-center">
            <h2 className="text-foreground mb-2 text-xl font-bold">
              Find the Prophets
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl pb-12">
              Events show whose predictions hold up, but the data is scattered
              in noise. The swarm gathers those signals from social media and
              builds a live picture of who you can trust.
            </p>
          </div>
          <div className="border-border relative border-y py-4">
            <div className="mx-auto w-full max-w-screen-md px-4">
              <MainPageFAQ />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
