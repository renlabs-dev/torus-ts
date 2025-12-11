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
import { api } from "~/trpc/react";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ExpandedFeedItem } from "../../../../_components/expanded-feed/expanded-feed-item/expanded-feed-item";

interface ProfileContentProps {
  username: string;
}

type VerdictTab = "ongoing" | "true" | "false";

export default function UserProfileContent({ username }: ProfileContentProps) {
  const { data: counts } = api.prediction.getCountsByUsername.useQuery({
    username,
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const limit = 30;

  const [activeTab, setActiveTab] = useState<VerdictTab>("ongoing");

  const ongoingPage = parseInt(searchParams.get("ongoing") ?? "1");
  const truePage = parseInt(searchParams.get("true") ?? "1");
  const falsePage = parseInt(searchParams.get("false") ?? "1");

  // Read filter params from URL
  const rawDateFrom = searchParams.get("dateFrom") ?? undefined;
  const rawDateTo = searchParams.get("dateTo") ?? undefined;
  const dateFrom =
    rawDateFrom && dayjs(rawDateFrom).isValid() ? rawDateFrom : undefined;
  const dateTo =
    rawDateTo && dayjs(rawDateTo).isValid() ? rawDateTo : undefined;
  const topicIds =
    searchParams.get("topics")?.split(",").filter(Boolean) ?? undefined;

  const { data: filteredCounts = counts ?? { ongoing: 0, true: 0, false: 0 } } =
    api.prediction.getCountsByUsername.useQuery({
      username,
      dateFrom,
      dateTo,
      topicIds,
    });

  // Fetch predictions separately per verdict status - only fetch active tab
  const { data: ongoingPredictions, isLoading: ongoingLoading } =
    api.prediction.getByUsernameAndVerdict.useQuery(
      {
        username,
        verdictStatus: "ongoing",
        limit,
        offset: (ongoingPage - 1) * limit,
        dateFrom,
        dateTo,
        topicIds,
      },
      {
        enabled: activeTab === "ongoing",
      },
    );

  const { data: truePredictions, isLoading: trueLoading } =
    api.prediction.getByUsernameAndVerdict.useQuery(
      {
        username,
        verdictStatus: "true",
        limit,
        offset: (truePage - 1) * limit,
        dateFrom,
        dateTo,
        topicIds,
      },
      {
        enabled: activeTab === "true",
      },
    );

  const { data: falsePredictions, isLoading: falseLoading } =
    api.prediction.getByUsernameAndVerdict.useQuery(
      {
        username,
        verdictStatus: "false",
        limit,
        offset: (falsePage - 1) * limit,
        dateFrom,
        dateTo,
        topicIds,
      },
      {
        enabled: activeTab === "false",
      },
    );

  // Pagination logic per tab using actual counts
  const ongoingTotalPages = Math.ceil(filteredCounts.ongoing / limit);
  const trueTotalPages = Math.ceil(filteredCounts.true / limit);
  const falseTotalPages = Math.ceil(filteredCounts.false / limit);

  const updatePage = (tab: string, newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(tab, newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab as VerdictTab);
  };

  return (
    <Card className="bg-background/80 plus-corners">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <CardHeader className="pb-0">
          <TabsList className="bg-accent/60 flex h-full w-full flex-col sm:grid sm:grid-cols-3">
            <TabsTrigger value="ongoing" className="w-full">
              Ongoing predictions ({filteredCounts.ongoing})
            </TabsTrigger>
            <TabsTrigger value="true" className="w-full">
              True predictions ({filteredCounts.true})
            </TabsTrigger>
            <TabsTrigger value="false" className="w-full">
              False predictions ({filteredCounts.false})
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        {/* Ongoing Predictions */}
        <TabsContent value="ongoing">
          <CardContent>
            <ExpandedFeedItem
              predictions={ongoingPredictions ?? []}
              variant="user"
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
            <ExpandedFeedItem
              predictions={truePredictions ?? []}
              variant="user"
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
            <ExpandedFeedItem
              predictions={falsePredictions ?? []}
              variant="user"
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
  );
}
