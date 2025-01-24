import { Suspense } from "react";
import { Loading } from "@torus-ts/ui";

export default function HomePage() {
  return (
    <Suspense fallback={<Loading />}>
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">Welcome to Torus Staking</h1>
        <p className="mt-4 text-xl">Get started by staking your tokens</p>
      </main>
    </Suspense>
  );
}
