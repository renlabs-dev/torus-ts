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

  // Fetch predictions separately per verdict status
  const { data: ongoingPredictions, isLoading: ongoingLoading } =
    api.prediction.getByUsernameAndVerdict.useQuery({
      username,
      verdictStatus: "ongoing",
      limit,
      offset: (ongoingPage - 1) * limit,
    });

  const { data: truePredictions, isLoading: trueLoading } =
    api.prediction.getByUsernameAndVerdict.useQuery({
      username,
      verdictStatus: "true",
      limit,
      offset: (truePage - 1) * limit,
    });

  const { data: falsePredictions, isLoading: falseLoading } =
    api.prediction.getByUsernameAndVerdict.useQuery({
      username,
      verdictStatus: "false",
      limit,
      offset: (falsePage - 1) * limit,
    });

  // Pagination logic per tab using actual counts
  const ongoingTotalPages = Math.ceil((counts?.ongoing ?? 0) / limit);
  const trueTotalPages = Math.ceil((counts?.true ?? 0) / limit);
  const falseTotalPages = Math.ceil((counts?.false ?? 0) / limit);

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
            <ProfileFeed
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
            <ProfileFeed
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
