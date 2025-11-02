"use client";

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
import { PageHeader } from "~/app/_components/page-header";
import { FeedLegend } from "~/app/_components/user-profile/feed-legend";
import { ProfileFeed } from "~/app/_components/user-profile/profile-feed";
import { api } from "~/trpc/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function FeedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const limit = 30;

  const ongoingPage = parseInt(searchParams.get("ongoing") ?? "1");
  const truePage = parseInt(searchParams.get("true") ?? "1");
  const falsePage = parseInt(searchParams.get("false") ?? "1");

  // Get total counts
  const { data: counts } = api.prediction.getFeedCounts.useQuery();

  // Fetch predictions separately per verdict status
  const { data: ongoingPredictions, isLoading: ongoingLoading } =
    api.prediction.getFeedByVerdict.useQuery({
      verdictStatus: "ongoing",
      limit,
      offset: (ongoingPage - 1) * limit,
    });

  const { data: truePredictions, isLoading: trueLoading } =
    api.prediction.getFeedByVerdict.useQuery({
      verdictStatus: "true",
      limit,
      offset: (truePage - 1) * limit,
    });

  const { data: falsePredictions, isLoading: falseLoading } =
    api.prediction.getFeedByVerdict.useQuery({
      verdictStatus: "false",
      limit,
      offset: (falsePage - 1) * limit,
    });

  // Calculate total pages from counts
  const ongoingTotalPages = Math.ceil((counts?.ongoing ?? 0) / limit);
  const trueTotalPages = Math.ceil((counts?.true ?? 0) / limit);
  const falseTotalPages = Math.ceil((counts?.false ?? 0) / limit);

  const updatePage = (tab: string, newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(tab, newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="relative pt-4">
      {/* Vertical borders spanning full height */}
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />

      {/* Header section */}
      <PageHeader
        title="Prediction Feed"
        description="View predictions from all tracked users"
      />

      {/* Full-width horizontal border */}
      <div className="border-border relative my-4 border-t" />

      {/* Legend */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <FeedLegend />
      </div>

      {/* Full-width horizontal border */}
      <div className="border-border relative my-4 border-t" />

      {/* Content section */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <Card className="bg-background/80 plus-corners relative backdrop-blur-lg">
          <Tabs defaultValue="ongoing">
            <CardHeader className="pb-0">
              <TabsList className="bg-accent/60 grid w-full grid-cols-3">
                <TabsTrigger value="ongoing">
                  Ongoing predictions ({counts?.ongoing ?? 0})
                </TabsTrigger>
                <TabsTrigger value="true">
                  True predictions ({counts?.true ?? 0})
                </TabsTrigger>
                <TabsTrigger value="false">
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
