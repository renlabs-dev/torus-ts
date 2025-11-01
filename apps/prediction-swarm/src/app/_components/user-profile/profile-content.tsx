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
import { useRouter, useSearchParams } from "next/navigation";
import { ProfileFeed } from "./profile-feed";

interface ProfileContentProps {
  username: string;
}

export default function ProfileContent({ username }: ProfileContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const limit = 30;

  const ongoingPage = parseInt(searchParams.get("ongoing") ?? "1");
  const truePage = parseInt(searchParams.get("true") ?? "1");
  const falsePage = parseInt(searchParams.get("false") ?? "1");

  // Get total counts for proper pagination
  const { data: counts } = api.prediction.getCountsByUsername.useQuery({
    username,
  });

  // Fetch all predictions and filter client-side
  const { data: allPredictions, isLoading } =
    api.prediction.getByUsername.useQuery({
      username,
      offset: 0,
    });

  // Filter by verdict status
  const ongoingPredictions =
    allPredictions?.filter(
      (tweet) => tweet.predictions[0]?.verdictId === null,
    ) ?? [];

  const truePredictions =
    allPredictions?.filter((tweet) => tweet.predictions[0]?.verdict === true) ??
    [];

  const falsePredictions =
    allPredictions?.filter(
      (tweet) => tweet.predictions[0]?.verdict === false,
    ) ?? [];

  // Pagination logic per tab using actual counts
  const ongoingTotalPages = Math.ceil((counts?.ongoing ?? 0) / limit);
  const trueTotalPages = Math.ceil((counts?.true ?? 0) / limit);
  const falseTotalPages = Math.ceil((counts?.false ?? 0) / limit);

  const ongoingPaginated = ongoingPredictions.slice(
    (ongoingPage - 1) * limit,
    ongoingPage * limit,
  );
  const truePaginated = truePredictions.slice(
    (truePage - 1) * limit,
    truePage * limit,
  );
  const falsePaginated = falsePredictions.slice(
    (falsePage - 1) * limit,
    falsePage * limit,
  );

  const updatePage = (tab: string, newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(tab, newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <Card className="bg-background/80 plus-corners">
      <Tabs defaultValue="ongoing">
        <CardHeader className="pb-0">
          <TabsList className="bg-accent/60 grid w-full grid-cols-3">
            <TabsTrigger value="ongoing">
              Ongoing predictions ({ongoingPredictions.length})
            </TabsTrigger>
            <TabsTrigger value="true">
              True predictions ({truePredictions.length})
            </TabsTrigger>
            <TabsTrigger value="false">
              False predictions ({falsePredictions.length})
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        {/* Ongoing Predictions */}
        <TabsContent value="ongoing">
          <CardContent>
            <ProfileFeed
              predictions={ongoingPaginated}
              variant="user"
              isLoading={isLoading}
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
              predictions={truePaginated}
              variant="user"
              isLoading={isLoading}
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
              predictions={falsePaginated}
              variant="user"
              isLoading={isLoading}
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
