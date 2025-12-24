"use client";

import CardsGrid from "~/app/_components/cards/cards-grid";
import type { Prophet } from "~/types/prophet";
import * as React from "react";

interface Props {
  prophets: Prophet[];
}

function usePageSizeByBreakpoint() {
  const [width, setWidth] = React.useState<number>(() =>
    typeof window === "undefined" ? 1024 : window.innerWidth,
  );

  React.useEffect(() => {
    function onResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Tailwind breakpoints: sm:640px, lg:1024px
  const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
  const rows = 2; // 2-row chunks feel natural on scroll
  const pageSize = cols * rows;
  return { cols, rows, pageSize } as const;
}

export default function PaginatedCardsGrid({ prophets }: Props) {
  const { pageSize } = usePageSizeByBreakpoint();

  // Number of chunks currently shown (1-based)
  const [page, setPage] = React.useState(1);
  const [isAutoLoad, setIsAutoLoad] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  // Reset pagination when the dataset changes (e.g., search)
  React.useEffect(() => {
    setPage(1);
  }, [prophets]);

  const totalPages = Math.max(1, Math.ceil(prophets.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const visibleCount = Math.min(prophets.length, clampedPage * pageSize);
  const visible = prophets.slice(0, visibleCount);
  const hasMore = clampedPage < totalPages;

  const loadNext = React.useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    // Small microtask to allow spinner to paint; real apps would fetch more here.
    const id = window.setTimeout(() => {
      setPage((p) => Math.min(totalPages, p + 1));
      setIsLoadingMore(false);
    }, 120);
    return () => window.clearTimeout(id);
  }, [hasMore, isLoadingMore, totalPages]);

  // Auto-load more when sentinel comes into view
  React.useEffect(() => {
    if (!isAutoLoad) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            loadNext();
          }
        }
      },
      { rootMargin: "300px 0px", threshold: 0.01 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isAutoLoad, loadNext, visibleCount]);

  return (
    <div>
      <CardsGrid prophets={visible} />

      {/* Bottom affordance: auto sentinel + accessible manual control */}
      {hasMore && (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 md:mt-10">
          {/* IntersectionObserver target */}
          <div ref={sentinelRef} aria-hidden className="h-1 w-1" />

          {/* Gradient hint bar */}
          <div className="pointer-events-none -mb-2 h-6 w-full max-w-3xl bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-60" />

          {/* Subtle control row */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadNext()}
              disabled={isLoadingMore}
              className="rounded-sm border border-white/10 px-4 py-2 text-sm text-white/90 hover:border-white/20 disabled:opacity-50"
            >
              {isLoadingMore ? "Loading…" : "Show more"}
            </button>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                className="size-3.5 accent-white/80"
                checked={isAutoLoad}
                onChange={(e) => setIsAutoLoad(e.target.checked)}
              />
              Auto-load on scroll
            </label>
          </div>
        </div>
      )}

      {/* Floating next button for one-handed browsing */}
      {hasMore && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            type="button"
            aria-label="Load next set"
            onClick={() => loadNext()}
            className="rounded-full border border-white/15 bg-black/50 px-4 py-2 text-sm text-white/90 backdrop-blur transition hover:border-white/25 hover:bg-black/60"
          >
            Scroll ↧
          </button>
        </div>
      )}
    </div>
  );
}
