import { Card } from "@torus-ts/ui/components/card";
import { api } from "~/trpc/server";
import Link from "next/link";

export default async function TickersPage() {
  const tickers = await api.topic.getTickers();

  return (
    <div className="relative py-10">
      {/* Vertical borders spanning full height */}
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />

      {/* Header section */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <div className="pb-8">
          <h1 className="flex items-center gap-2 text-3xl font-thin">
            Tickers
          </h1>
          <p className="text-muted-foreground mt-2">
            Browse predictions by cryptocurrency ticker
          </p>
        </div>
      </div>

      {/* Full-width horizontal border */}
      <div className="border-border relative my-6 border-t" />

      {/* Content section */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickers.map((ticker) => (
            <div key={ticker.id} className="plus-corners">
              <Link href={`/ticker/${ticker.name}`}>
                <Card className="bg-background/80 hover:bg-background/90 relative backdrop-blur-lg transition-colors">
                  <div className="p-6 text-center">
                    <h3 className="text-2xl font-bold uppercase">
                      {ticker.name}
                    </h3>
                  </div>
                </Card>
              </Link>
            </div>
          ))}

          {tickers.length === 0 && (
            <div className="text-muted-foreground col-span-full py-12 text-center">
              <p>No tickers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom border */}
      <div className="border-border relative mt-10 border-t" />
    </div>
  );
}
