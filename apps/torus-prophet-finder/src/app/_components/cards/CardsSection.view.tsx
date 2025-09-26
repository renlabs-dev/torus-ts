"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { useBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import AddProphetForm from "~/app/_components/cards/AddProphetForm";
import AddTickerForm from "~/app/_components/cards/AddTickerForm";
import CardsGrid from "~/app/_components/cards/CardsGrid";
import CardsHeader from "~/app/_components/cards/CardsHeader";
import EmptyState from "~/app/_components/cards/EmptyState";
import EntityModeToggle from "~/app/_components/cards/EntityModeToggle";
import type { EntityMode } from "~/app/_components/cards/EntityModeToggle";
import SearchInput from "~/app/_components/cards/SearchInput";
import StableHeight from "~/app/_components/cards/StableHeight";
import TickersGrid from "~/app/_components/cards/TickersGrid";
import { useProphets } from "~/app/_components/cards/useProphets";
import { useTickers } from "~/app/_components/cards/useTickers";
import StarfieldBackground from "~/app/_components/effects/StarfieldBackground";
import * as React from "react";

export default function CardsSection() {
  const STAKE_REQUIRED_MSG = "You must have staked balance present.";
  const { prophets, addProphet } = useProphets();
  const { tickers, addTicker } = useTickers();
  const { api, selectedAccount } = useTorus();
  const accountBalance = useBalance(
    api,
    selectedAccount?.address as SS58Address,
  );
  const hasStake = React.useMemo(() => {
    const staked = accountBalance.data?.staked ?? 0n;
    return staked > 0n;
  }, [accountBalance.data?.staked]);
  const showStakeWarning =
    selectedAccount != null && accountBalance.isFetching === false && !hasStake;
  const [query, setQuery] = React.useState("");
  const [mode, setMode] = React.useState<EntityMode>("prophets");
  const [isOverlayVisible, setOverlayVisible] = React.useState(false);
  const [isOverlayOpaque, setOverlayOpaque] = React.useState(false);
  const [uiError, setUiError] = React.useState<string | null>(null);
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
    (raw: string) => {
      if (!hasStake) {
        setUiError(STAKE_REQUIRED_MSG);
        return STAKE_REQUIRED_MSG;
      }
      const err = addProphet(raw).error ?? null;
      setUiError(err);
      return err;
    },
    [addProphet, hasStake],
  );

  const handleAddTicker = React.useCallback(
    (raw: string) => {
      if (!hasStake) {
        setUiError(STAKE_REQUIRED_MSG);
        return STAKE_REQUIRED_MSG;
      }
      const err = addTicker(raw).error ?? null;
      setUiError(err);
      return err;
    },
    [addTicker, hasStake],
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
    [mode, isOverlayVisible],
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
      <div className="pointer-events-none absolute inset-0 z-0 bg-black/60" />
      <div className="relative z-20 mx-auto w-full max-w-6xl px-6 sm:px-8 md:px-10">
        <CardsHeader mode={mode} />

        <div className="flex flex-wrap items-center justify-center gap-4">
          <EntityModeToggle mode={mode} onChange={handleModeChange} />
        </div>

        <div className="relative mb-6 mt-5 flex flex-wrap items-center gap-3 sm:mb-8 md:mb-10">
          {(uiError != null || showStakeWarning) && (
            <div
              aria-live="polite"
              className="pointer-events-none absolute -top-5 right-0 text-[11px] font-medium text-red-300/90"
            >
              {uiError ?? STAKE_REQUIRED_MSG}
            </div>
          )}
          {mode === "prophets" ? (
            <>
              <SearchInput
                value={query}
                onChange={setQuery}
                id="prophet-search"
                label="Search prophets by name"
                placeholder="Search prophets by name…"
              />
              <AddProphetForm
                onAdd={handleAddProphet}
                suppressErrorMessage={() => true}
              />
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
              <AddTickerForm
                onAdd={handleAddTicker}
                suppressErrorMessage={() => true}
              />
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
                <EmptyState
                  title="No prophets match your search"
                  hint="Try a different name or clear the search."
                />
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
                <EmptyState
                  title="No tickers match your search"
                  hint="Try BTC, ETH, SOL… or clear the search."
                />
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
