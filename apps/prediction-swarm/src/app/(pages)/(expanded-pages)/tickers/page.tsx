import { Card } from "@torus-ts/ui/components/card";
import { TOP_100_TICKERS } from "@torus-ts/ui/lib/tickers";
import { PageHeader } from "~/app/_components/page-header";
import Link from "next/link";

export default function TickersPage() {
  const tickers = TOP_100_TICKERS;

  return (
    <div className="relative pt-4">
      {/* Vertical borders spanning full height */}
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />

      {/* Header section */}
      <PageHeader
        title="Tickers"
        description="Browse predictions by cryptocurrency ticker"
      />

      {/* Full-width horizontal border */}
      <div className="border-border relative my-6 border-t" />

      {/* Content section */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tickers.map((ticker) => (
            <div key={ticker} className="plus-corners">
              <Link href={`/ticker/${ticker.toLowerCase()}`}>
                <Card className="bg-background/80 hover:bg-background/90 relative backdrop-blur-lg transition-colors">
                  <div className="p-6 text-center">
                    <h3 className="text-2xl font-bold uppercase">{ticker}</h3>
                  </div>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom border */}
      <div className="border-border relative mt-10 border-t" />
    </div>
  );
}
