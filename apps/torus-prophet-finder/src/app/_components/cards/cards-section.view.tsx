"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { useBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import AddProphetForm from "~/app/_components/cards/add-prophet-form";
// import AddTickerForm from "~/app/_components/cards/add-ticker-form";
import CardsGrid from "~/app/_components/cards/cards-grid";
import CardsHeader from "~/app/_components/cards/cards-header";
import CardsRaysBackground from "~/app/_components/cards/cards-rays-background";
import CardsBorderGlow from "~/app/_components/cards/cards-border-glow";
import TextureFilters from "~/app/_components/cards/effects/texture-filters";
import EmptyState from "~/app/_components/cards/empty-state";
// import EntityModeToggle from "~/app/_components/cards/entity-mode-toggle";
import type { EntityMode } from "~/app/_components/cards/entity-mode-toggle";
import SearchInput from "~/app/_components/cards/search-input";
import StableHeight from "~/app/_components/cards/stable-height";
// import TickersGrid from "~/app/_components/cards/tickers-grid";
import { useProphets } from "~/app/_components/cards/use-prophets";
// import { useTickers } from "~/app/_components/cards/use-tickers";
import StarfieldBackground from "~/app/_components/effects/starfield-background";
import { useSubmitProphetTask } from "~/hooks/use-submit-prophet-task";
import * as React from "react";

export default function CardsSection() {
  const STAKE_REQUIRED_MSG = "You must have staked balance present.";
  const { prophets, addProphet } = useProphets();
  // const { tickers, addTicker } = useTickers();
  const { api, selectedAccount } = useTorus();
  const { submit: submitProphetTask } = useSubmitProphetTask();
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
  const mode: EntityMode = "prophets"; // Fixed to prophets only
  // const [mode, setMode] = React.useState<EntityMode>("prophets");
  // const [isOverlayVisible, setOverlayVisible] = React.useState(false);
  // const [isOverlayOpaque, setOverlayOpaque] = React.useState(false);
  const [uiError, setUiError] = React.useState<string | null>(null);
  // const timeouts = React.useRef<number[]>([]);

  const filteredProphets = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prophets;
    return prophets.filter((p) => p.name.toLowerCase().includes(q));
  }, [query, prophets]);

  // const filteredTickers = React.useMemo(() => {
  //   const q = query.trim().replace(/^\$+/, "").toUpperCase();
  //   if (!q) return tickers;
  //   return tickers.filter((t) => t.symbol.toUpperCase().includes(q));
  // }, [query, tickers]);

  const handleAddProphet = React.useCallback(
    (raw: string) => {
      if (!hasStake) {
        setUiError(STAKE_REQUIRED_MSG);
        return STAKE_REQUIRED_MSG;
      }
      const result = addProphet(raw);
      const err = result.error ?? null;
      setUiError(err);

      if (!err) {
        const normalizedUsername = raw.replace(/^@/, "").trim();
        void submitProphetTask(normalizedUsername);
      }

      return err;
    },
    [addProphet, hasStake, submitProphetTask],
  );

  // const handleAddTicker = React.useCallback(
  //   (raw: string) => {
  //     if (!hasStake) {
  //       setUiError(STAKE_REQUIRED_MSG);
  //       return STAKE_REQUIRED_MSG;
  //     }
  //     const err = addTicker(raw).error ?? null;
  //     setUiError(err);
  //     return err;
  //   },
  //   [addTicker, hasStake],
  // );

  // const handleModeChange = React.useCallback(
  //   (next: EntityMode) => {
  //     if (next === mode) return;
  //     if (isOverlayVisible) return; // prevent re-entrancy during transition
  //     // Begin fade-through-black transition
  //     setOverlayVisible(true);
  //     // ensure transition kicks in
  //     requestAnimationFrame(() => setOverlayOpaque(true));
  //     const t1 = window.setTimeout(() => {
  //       setMode(next); // switch content while covered
  //       setOverlayOpaque(false);
  //       const t2 = window.setTimeout(() => setOverlayVisible(false), 220);
  //       timeouts.current.push(t2);
  //     }, 220);
  //     timeouts.current.push(t1);
  //   },
  //   [mode, isOverlayVisible],
  // );

  // React.useEffect(() => {
  //   return () => {
  //     timeouts.current.forEach((id) => window.clearTimeout(id));
  //     timeouts.current = [];
  //   };
  // }, []);

  return (
    <section
      id="content"
      className="relative w-full overflow-hidden py-12 sm:py-16 md:py-20"
    >
      <TextureFilters />
      <StarfieldBackground />
      {/* Central godrays background and extremely subtle border glow */}
      <CardsRaysBackground />
      <CardsBorderGlow />
      {/* Exact mirror of hero bottom shadow at the top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[16] h-24 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-black/60" />
      <div className="relative z-20 mx-auto w-full max-w-6xl px-6 sm:px-8 md:px-10">
        <CardsHeader mode={mode} />

        {/* <div className="flex flex-wrap items-center justify-center gap-4">
          <EntityModeToggle mode={mode} onChange={handleModeChange} />
        </div> */}

        <div className="relative mb-6 mt-5 flex flex-wrap items-center gap-3 sm:mb-8 md:mb-10">
          {(uiError != null || showStakeWarning) && (
            <div
              aria-live="polite"
              className="pointer-events-none absolute -top-5 right-0 text-[11px] font-medium text-red-300/90"
            >
              {uiError ?? STAKE_REQUIRED_MSG}
            </div>
          )}
          <SearchInput
            value={query}
            onChange={setQuery}
            id="prophet-search"
            label="Type a prophet handle to add"
            placeholder="Type a prophet handle (e.g., @satoshi) to add"
          />
          <AddProphetForm
            onAdd={handleAddProphet}
            suppressErrorMessage={() => true}
            searchValue={query}
          />
          {/* {mode === "prophets" ? (
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
                searchValue={query}
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
          )} */}
        </div>

        <div className="relative">
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
          {/* {mode === "prophets" ? (
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
          )} */}
        </div>
      </div>
      {/* {isOverlayVisible && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-50 bg-black transition-opacity duration-200 ease-out ${
            isOverlayOpaque ? "opacity-100" : "opacity-0"
          }`}
        />
      )} */}
    </section>
  );
}
