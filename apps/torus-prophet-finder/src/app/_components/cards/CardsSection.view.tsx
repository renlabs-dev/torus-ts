"use client";

import * as React from "react";
import { useProphets } from "~/app/_components/cards/useProphets";
import { useTickers } from "~/app/_components/cards/useTickers";
import CardsHeader from "~/app/_components/cards/CardsHeader";
import SearchInput from "~/app/_components/cards/SearchInput";
import AddProphetForm from "~/app/_components/cards/AddProphetForm";
import AddTickerForm from "~/app/_components/cards/AddTickerForm";
import CardsGrid from "~/app/_components/cards/CardsGrid";
import TickersGrid from "~/app/_components/cards/TickersGrid";
import EntityModeToggle, { type EntityMode } from "~/app/_components/cards/EntityModeToggle";
import StarfieldBackground from "~/app/_components/effects/StarfieldBackground";
import StableHeight from "~/app/_components/cards/StableHeight";
import EmptyState from "~/app/_components/cards/EmptyState";

export default function CardsSection() {
  const { prophets, addProphet } = useProphets();
  const { tickers, addTicker } = useTickers();
  const [query, setQuery] = React.useState("");
  const [mode, setMode] = React.useState<EntityMode>("prophets");
  const [isOverlayVisible, setOverlayVisible] = React.useState(false);
  const [isOverlayOpaque, setOverlayOpaque] = React.useState(false);
  const timeouts = React.useRef<number[]>([]);

  const filteredProphets = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prophets;
    return prophets.filter((p) => p.name.toLowerCase().includes(q));
  }, [query, prophets]);

  const filteredTickers = React.useMemo(() => {
    const q = query.trim().replace(/^\$+/, "").toUpperCase();
    if (!q) return tickers;
    return tickers.filter((t) => t.symbol.toUpperCase().includes(q));
  }, [query, tickers]);

  const handleAddProphet = React.useCallback(
    (raw: string) => addProphet(raw).error ?? null,
    [addProphet]
  );

  const handleAddTicker = React.useCallback(
    (raw: string) => addTicker(raw).error ?? null,
    [addTicker]
  );

  const handleModeChange = React.useCallback(
    (next: EntityMode) => {
      if (next === mode) return;
      if (isOverlayVisible) return; // prevent re-entrancy during transition
      // Begin fade-through-black transition
      setOverlayVisible(true);
      // ensure transition kicks in
      requestAnimationFrame(() => setOverlayOpaque(true));
      const t1 = window.setTimeout(() => {
        setMode(next); // switch content while covered
        setOverlayOpaque(false);
        const t2 = window.setTimeout(() => setOverlayVisible(false), 220);
        timeouts.current.push(t2);
      }, 220);
      timeouts.current.push(t1);
    },
    [mode, isOverlayVisible]
  );

  React.useEffect(() => {
    return () => {
      timeouts.current.forEach((id) => window.clearTimeout(id));
      timeouts.current = [];
    };
  }, []);

  return (
    <section
      id="content"
      className="relative w-full overflow-hidden py-12 sm:py-16 md:py-20"
    >
      <StarfieldBackground />
      <div className="pointer-events-none absolute inset-0 bg-black/60 z-0" />
      <div className="relative z-20 w-full mx-auto max-w-6xl px-6 sm:px-8 md:px-10">
        <CardsHeader mode={mode} />

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <EntityModeToggle mode={mode} onChange={handleModeChange} />
        </div>

        <div className="mt-5 mb-6 sm:mb-8 md:mb-10 flex items-center gap-3 flex-wrap">
          {mode === "prophets" ? (
            <>
              <SearchInput
                value={query}
                onChange={setQuery}
                id="prophet-search"
                label="Search prophets by name"
                placeholder="Search prophets by name…"
              />
              <AddProphetForm onAdd={handleAddProphet} />
            </>
          ) : (
            <>
              <SearchInput
                value={query}
                onChange={setQuery}
                id="ticker-search"
                label="Search tickers by symbol"
                placeholder="Search tickers (e.g., BTC, ETH)…"
              />
              <AddTickerForm onAdd={handleAddTicker} />
            </>
          )}
        </div>

        <div className="relative">
          {mode === "prophets" ? (
            <StableHeight
              locked={filteredProphets.length === 0}
              minEmptyPx={640}
              className="min-h-[40vh]"
            >
              {filteredProphets.length > 0 ? (
                <CardsGrid prophets={filteredProphets} />
              ) : (
                <EmptyState title="No prophets match your search" hint="Try a different name or clear the search." />
              )}
            </StableHeight>
          ) : (
            <StableHeight
              locked={filteredTickers.length === 0}
              minEmptyPx={640}
              className="min-h-[40vh]"
            >
              {filteredTickers.length > 0 ? (
                <TickersGrid tickers={filteredTickers} />
              ) : (
                <EmptyState title="No tickers match your search" hint="Try BTC, ETH, SOL… or clear the search." />
              )}
            </StableHeight>
          )}

        </div>
      </div>
      {isOverlayVisible && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-50 bg-black transition-opacity duration-200 ease-out ${
            isOverlayOpaque ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </section>
  );
}
