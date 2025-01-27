import { Suspense } from "react";
import { Loading } from "@torus-ts/ui";
import { HeroSection } from "./components/hero-section";
import { StakingForm } from "./components/staking-section/staking-form";

export default function HomePage() {
  return (
    <Suspense fallback={<Loading />}>
      <div className="flex min-h-screen flex-col">
        <HeroSection />

        <main className="flex-1 bg-background px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-8">
              <h2 className="text-3xl font-bold">Stake Your Tokens</h2>
              <StakingForm />
            </div>
          </div>
        </main>
      </div>
    </Suspense>
  );
}
