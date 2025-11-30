"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@torus-ts/ui/components/pagination";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { FilterDialog } from "~/app/_components/filter-dialog";
import { PageHeader } from "~/app/_components/page-header";
import { FeedLegend } from "~/app/_components/user-profile/feed-legend";
import { ProfileFeed } from "~/app/_components/user-profile/profile-feed";
import { api } from "~/trpc/react";
import { Eye, Globe, Star } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type FeedView = "all" | "watched" | "starred";

export default function FeedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const limit = 30;

  const { selectedAccount } = useTorus();
  const isConnected = !!selectedAccount?.address;
  const walletAddress = selectedAccount?.address;
  const utils = api.useUtils();

  // Get current view from URL (default to "all")
  const viewParam = searchParams.get("view");
  const view: FeedView =
    viewParam === "watched"
      ? "watched"
      : viewParam === "starred"
        ? "starred"
        : "all";

  const ongoingPage = parseInt(searchParams.get("ongoing") ?? "1");
  const truePage = parseInt(searchParams.get("true") ?? "1");
  const falsePage = parseInt(searchParams.get("false") ?? "1");

  // Read filter params from URL
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const topicIds =
    searchParams.get("topics")?.split(",").filter(Boolean) ?? undefined;

  // Enable watched/starred views when connected
  const canUseWatched = isConnected;
  const canUseStarred = isConnected;

  // Invalidate watch/star queries when wallet changes
  useEffect(() => {
    void utils.watch.invalidate();
    void utils.star.invalidate();
    // Reset to "all" view when wallet changes
    if (view === "watched" || view === "starred") {
      setView("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when wallet changes
  }, [walletAddress]);

  // === ALL FEED QUERIES ===
  const { data: allCounts } = api.prediction.getFeedCounts.useQuery(undefined, {
    enabled: view === "all",
  });

  const { data: allOngoingPredictions, isLoading: allOngoingLoading } =
    api.prediction.getFeedByVerdict.useQuery(
      {
        verdictStatus: "ongoing",
        limit,
        offset: (ongoingPage - 1) * limit,
        dateFrom,
        dateTo,
        topicIds,
      },
      { enabled: view === "all" },
    );

  const { data: allTruePredictions, isLoading: allTrueLoading } =
    api.prediction.getFeedByVerdict.useQuery(
      {
        verdictStatus: "true",
        limit,
        offset: (truePage - 1) * limit,
        dateFrom,
        dateTo,
        topicIds,
      },
      { enabled: view === "all" },
    );

  const { data: allFalsePredictions, isLoading: allFalseLoading } =
    api.prediction.getFeedByVerdict.useQuery(
      {
        verdictStatus: "false",
        limit,
        offset: (falsePage - 1) * limit,
        dateFrom,
        dateTo,
        topicIds,
      },
      { enabled: view === "all" },
    );

  // === WATCHED FEED QUERIES ===
  const { data: watchedCounts } = api.watch.getWatchingFeedCounts.useQuery(
    { userKey: walletAddress ?? "" },
    {
      enabled: view === "watched" && isConnected,
    },
  );

  const { data: watchedOngoingPredictions, isLoading: watchedOngoingLoading } =
    api.watch.getWatchingFeedByVerdict.useQuery(
      {
        userKey: walletAddress ?? "",
        verdictStatus: "ongoing",
        limit,
        offset: (ongoingPage - 1) * limit,
        dateFrom,
        dateTo,
        topicIds,
      },
      { enabled: view === "watched" && isConnected },
    );

  const { data: watchedTruePredictions, isLoading: watchedTrueLoading } =
    api.watch.getWatchingFeedByVerdict.useQuery(
      {
        userKey: walletAddress ?? "",
        verdictStatus: "true",
        limit,
        offset: (truePage - 1) * limit,
        dateFrom,
        dateTo,
        topicIds,
      },
      { enabled: view === "watched" && isConnected },
    );

  const { data: watchedFalsePredictions, isLoading: watchedFalseLoading } =
    api.watch.getWatchingFeedByVerdict.useQuery(
      {
        userKey: walletAddress ?? "",
        verdictStatus: "false",
        limit,
        offset: (falsePage - 1) * limit,
        dateFrom,
        dateTo,
        topicIds,
      },
      { enabled: view === "watched" && isConnected },
    );

  // === STARRED FEED QUERIES ===
  const { data: starredCounts } = api.star.getStarredFeedCounts.useQuery(
    { userKey: walletAddress ?? "" },
    {
      enabled: view === "starred" && isConnected,
    },
  );

  const { data: starredOngoingPredictions, isLoading: starredOngoingLoading } =
    api.star.getStarredFeedByVerdict.useQuery(
      {
        userKey: walletAddress ?? "",
        verdictStatus: "ongoing",
        limit,
        offset: (ongoingPage - 1) * limit,
        dateFrom,
        dateTo,
        topicIds,
      },
      { enabled: view === "starred" && isConnected },
    );

  const { data: starredTruePredictions, isLoading: starredTrueLoading } =
    api.star.getStarredFeedByVerdict.useQuery(
      {
        userKey: walletAddress ?? "",
        verdictStatus: "true",
        limit,
        offset: (truePage - 1) * limit,
        dateFrom,
        dateTo,
        topicIds,
      },
      { enabled: view === "starred" && isConnected },
    );

  const { data: starredFalsePredictions, isLoading: starredFalseLoading } =
    api.star.getStarredFeedByVerdict.useQuery(
      {
        userKey: walletAddress ?? "",
        verdictStatus: "false",
        limit,
        offset: (falsePage - 1) * limit,
        dateFrom,
        dateTo,
        topicIds,
      },
      { enabled: view === "starred" && isConnected },
    );

  // Select data based on current view
  const counts =
    view === "all"
      ? allCounts
      : view === "watched"
        ? watchedCounts
        : starredCounts;
  const ongoingPredictions =
    view === "all"
      ? allOngoingPredictions
      : view === "watched"
        ? watchedOngoingPredictions
        : starredOngoingPredictions;
  const truePredictions =
    view === "all"
      ? allTruePredictions
      : view === "watched"
        ? watchedTruePredictions
        : starredTruePredictions;
  const falsePredictions =
    view === "all"
      ? allFalsePredictions
      : view === "watched"
        ? watchedFalsePredictions
        : starredFalsePredictions;
  const ongoingLoading =
    view === "all"
      ? allOngoingLoading
      : view === "watched"
        ? watchedOngoingLoading
        : starredOngoingLoading;
  const trueLoading =
    view === "all"
      ? allTrueLoading
      : view === "watched"
        ? watchedTrueLoading
        : starredTrueLoading;
  const falseLoading =
    view === "all"
      ? allFalseLoading
      : view === "watched"
        ? watchedFalseLoading
        : starredFalseLoading;

  // Calculate total pages from counts
  const ongoingTotalPages = Math.ceil((counts?.ongoing ?? 0) / limit);
  const trueTotalPages = Math.ceil((counts?.true ?? 0) / limit);
  const falseTotalPages = Math.ceil((counts?.false ?? 0) / limit);

  const updatePage = (tab: string, newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(tab, newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const setView = (newView: FeedView) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    // Reset pagination when switching views
    params.set("ongoing", "1");
    params.set("true", "1");
    params.set("false", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="relative pt-4">
      {/* Vertical borders spanning full height */}
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />

      {/* Header section */}
      <PageHeader
        title="Prediction Feed"
        description={
          view === "watched"
            ? "View predictions from users you're watching"
            : view === "starred"
              ? "View your starred predictions"
              : "View predictions from all tracked users"
        }
        children={<FilterDialog />}
      />

      {/* Full-width horizontal border */}
      <div className="border-border relative my-4 border-t" />

      {/* Legend */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <FeedLegend />
      </div>

      <div className="border-border relative my-4 border-t" />

      <div className="relative mx-auto max-w-screen-lg px-4">
        <Card className="plus-corners bg-background/80 backdrop-blur-sm">
          <Tabs value={view} onValueChange={(v) => setView(v as FeedView)}>
            <TabsList className="bg-accent/60 flex h-full w-full flex-col sm:grid sm:grid-cols-3">
              <TabsTrigger value="all" className="w-full gap-2">
                <Globe className="h-4 w-4" />
                All Accounts
              </TabsTrigger>
              <TabsTrigger
                value="watched"
                disabled={!canUseWatched}
                className="w-full gap-2"
                title={
                  !isConnected
                    ? "Connect wallet to use watched feed"
                    : undefined
                }
              >
                <Eye className="h-4 w-4" />
                Your Watched
              </TabsTrigger>
              <TabsTrigger
                value="starred"
                disabled={!canUseStarred}
                className="w-full gap-2"
                title={
                  !isConnected
                    ? "Connect wallet to use starred feed"
                    : undefined
                }
              >
                <Star className="h-4 w-4" />
                Your Starred
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
      </div>

      {/* Full-width horizontal border */}
      <div className="border-border relative my-4 border-t" />

      {/* Content section */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <Card className="bg-background/80 plus-corners relative backdrop-blur-lg">
          <Tabs defaultValue="ongoing">
            <CardHeader className="pb-0">
              <TabsList className="bg-accent/60 flex h-full w-full flex-col sm:grid sm:grid-cols-3">
                <TabsTrigger value="ongoing" className="w-full">
                  Ongoing predictions ({counts?.ongoing ?? 0})
                </TabsTrigger>
                <TabsTrigger value="true" className="w-full">
                  True predictions ({counts?.true ?? 0})
                </TabsTrigger>
                <TabsTrigger value="false" className="w-full">
                  False predictions ({counts?.false ?? 0})
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* Ongoing Predictions */}
            <TabsContent value="ongoing">
              <CardContent>
                <ProfileFeed
                  predictions={ongoingPredictions ?? []}
                  variant="feed"
                  isLoading={ongoingLoading}
                />
                {ongoingTotalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            ongoingPage > 1 &&
                            updatePage("ongoing", ongoingPage - 1)
                          }
                          className={
                            ongoingPage <= 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="text-muted-foreground text-sm">
                          Page {ongoingPage} of {ongoingTotalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            ongoingPage < ongoingTotalPages &&
                            updatePage("ongoing", ongoingPage + 1)
                          }
                          className={
                            ongoingPage >= ongoingTotalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </CardContent>
            </TabsContent>

            {/* True Predictions */}
            <TabsContent value="true">
              <CardContent>
                <ProfileFeed
                  predictions={truePredictions ?? []}
                  variant="feed"
                  isLoading={trueLoading}
                />
                {trueTotalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            truePage > 1 && updatePage("true", truePage - 1)
                          }
                          className={
                            truePage <= 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="text-muted-foreground text-sm">
                          Page {truePage} of {trueTotalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            truePage < trueTotalPages &&
                            updatePage("true", truePage + 1)
                          }
                          className={
                            truePage >= trueTotalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </CardContent>
            </TabsContent>

            {/* False Predictions */}
            <TabsContent value="false">
              <CardContent>
                <ProfileFeed
                  predictions={falsePredictions ?? []}
                  variant="feed"
                  isLoading={falseLoading}
                />
                {falseTotalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            falsePage > 1 && updatePage("false", falsePage - 1)
                          }
                          className={
                            falsePage <= 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="text-muted-foreground text-sm">
                          Page {falsePage} of {falseTotalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            falsePage < falseTotalPages &&
                            updatePage("false", falsePage + 1)
                          }
                          className={
                            falsePage >= falseTotalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Bottom border */}
      <div className="border-border relative mt-10 border-t" />
    </div>
  );
}
