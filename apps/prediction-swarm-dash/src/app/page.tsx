import { cn } from "@torus-ts/ui/lib/utils";
import { MoveDown } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Footer } from "./_components/footer";
import { FractalGrid } from "./_components/fractal-grid";
import { Header } from "./_components/header";
import { SearchInput } from "./_components/search-input";
import { SphereAnimation } from "./_components/sphere-animation";
import { StatsGrid } from "./_components/stats-grid";

export default function Home() {
  redirect("/dashboard");

  return (
    <main className={cn("animate-fade")}>
      <Header className="from-background !absolute bg-gradient-to-b to-transparent" />
      <div className="bg-background relative flex h-[calc(100vh-15rem)] w-full flex-col items-center justify-center">
        <SphereAnimation />
      </div>
      <Suspense fallback={<div className="h-18" />}>
        <div
          className={cn(
            "sticky top-0 z-40",
            "animate-fade-up animate-delay-500",
          )}
        >
          <SearchInput />
        </div>
      </Suspense>
      <div className="text-muted-foreground flex w-full justify-center px-10 sm:px-0">
        <div
          className={cn(
            "my-[4.5rem] flex w-full max-w-screen-xl justify-between",
            "animate-fade-up animate-delay-1000",
          )}
        >
          <span>Scroll to view more.</span>
          <MoveDown size={18} />
        </div>
      </div>
      <FractalGrid />
      <StatsGrid />
      <Footer />
    </main>
  );
}
