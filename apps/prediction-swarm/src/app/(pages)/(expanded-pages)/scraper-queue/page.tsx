"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { cn } from "@torus-ts/ui/lib/utils";
import { PageHeader } from "~/app/_components/page-header";
import { QueueItem } from "~/app/_components/scraper-queue/queue-item";
import { api } from "~/trpc/react";
import dayjs from "dayjs";
import { Loader2 } from "lucide-react";

export default function ScraperQueuePage() {
  const { selectedAccount, isAccountConnected } = useTorus();
  const { data: queue, isLoading } = api.scraperQueue.getQueueStatus.useQuery();

  // Filter completed accounts to only those from last 24 hours
  const oneDayAgo = dayjs().subtract(1, "day");
  const recentlyCompleted =
    queue?.filter(
      (item) =>
        item.status === "complete" &&
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        item.suggestedAt &&
        dayjs(item.suggestedAt).isAfter(oneDayAgo),
    ) ?? [];

  // Separate by status
  const suggested = queue?.filter((item) => item.status === "suggested") ?? [];
  const scraping = queue?.filter((item) => item.status === "scraping") ?? [];
  const processing =
    queue?.filter((item) => item.status === "processing") ?? [];

  // Separate user's accounts from each category
  const getUserAccounts = (items: typeof queue) =>
    items?.filter(
      (item) =>
        isAccountConnected &&
        selectedAccount?.address &&
        item.suggestedBy === selectedAccount.address,
    ) ?? [];

  const getOtherAccounts = (items: typeof queue, userItems: typeof queue) =>
    items?.filter(
      (item) => !userItems?.find((u) => u.username === item.username),
    ) ?? [];

  const userQueue = getUserAccounts(queue ?? []);
  const hasUserAccounts = userQueue.length > 0;

  return (
    <div className="relative py-4">
      {/* Vertical borders */}
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />

      {/* Header */}
      <PageHeader
        title="Scraper Queue"
        description="Track the progress of accounts being added to the swarm"
      />

      {/* Border */}
      <div className="border-border relative my-4 border-t" />

      <div className="relative mx-auto max-w-screen-lg space-y-6 px-4">
        {!isAccountConnected && (
          <Card className="bg-background/80 plus-corners backdrop-blur-lg">
            <CardContent className="p-5 text-center">
              <p className="text-lg font-medium">Connect Your Wallet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Connect your wallet on the top right to track accounts you've
                added to the queue
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Border */}
      <div className="border-border relative my-4 border-t" />

      {/* Content */}
      <div className="relative mx-auto max-w-screen-lg space-y-6 px-4">
        {/* User's Accounts - Always visible at top */}

        <Card className="bg-background/80 plus-corners backdrop-blur-lg">
          <Tabs defaultValue="suggested">
            <CardHeader className="pb-0">
              <TabsList
                className={cn(
                  "bg-accent/60 flex h-full w-full flex-col sm:grid",
                  hasUserAccounts ? "sm:grid-cols-5" : "sm:grid-cols-4",
                )}
              >
                <TabsTrigger value="suggested" className="w-full">
                  Suggested ({suggested.length})
                </TabsTrigger>
                <TabsTrigger value="scraping" className="w-full">
                  Scraping ({scraping.length})
                </TabsTrigger>
                <TabsTrigger value="processing" className="w-full">
                  Processing ({processing.length})
                </TabsTrigger>
                <TabsTrigger value="complete" className="w-full">
                  Complete ({recentlyCompleted.length})
                </TabsTrigger>
                {hasUserAccounts && (
                  <TabsTrigger value="mine" className="w-full">
                    My Accounts ({userQueue.length})
                  </TabsTrigger>
                )}
              </TabsList>
            </CardHeader>

            {/* Suggested Tab */}
            <TabsContent value="suggested">
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="text-primary h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    {getUserAccounts(suggested).map((item) => (
                      <div
                        key={`${item.username}-${item.suggestedBy}`}
                        className="mb-3"
                      >
                        <QueueItem item={item} />
                      </div>
                    ))}
                    {getOtherAccounts(
                      suggested,
                      getUserAccounts(suggested),
                    ).map((item) => (
                      <div
                        key={`${item.username}-${item.suggestedBy}`}
                        className="mb-3"
                      >
                        <QueueItem item={item} />
                      </div>
                    ))}
                    {suggested.length === 0 && (
                      <div className="text-muted-foreground py-12 text-center">
                        No suggested accounts
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </TabsContent>

            {/* Scraping Tab */}
            <TabsContent value="scraping">
              <CardContent>
                {getUserAccounts(scraping).map((item) => (
                  <div
                    key={`${item.username}-${item.suggestedBy}`}
                    className="mb-3"
                  >
                    <QueueItem item={item} />
                  </div>
                ))}
                {getOtherAccounts(scraping, getUserAccounts(scraping)).map(
                  (item) => (
                    <div
                      key={`${item.username}-${item.suggestedBy}`}
                      className="mb-3"
                    >
                      <QueueItem item={item} />
                    </div>
                  ),
                )}
                {scraping.length === 0 && (
                  <div className="text-muted-foreground py-12 text-center">
                    No accounts currently scraping
                  </div>
                )}
              </CardContent>
            </TabsContent>

            {/* Processing Tab */}
            <TabsContent value="processing">
              <CardContent>
                {getUserAccounts(processing).map((item) => (
                  <div
                    key={`${item.username}-${item.suggestedBy}`}
                    className="mb-3"
                  >
                    <QueueItem item={item} />
                  </div>
                ))}
                {getOtherAccounts(processing, getUserAccounts(processing)).map(
                  (item) => (
                    <div
                      key={`${item.username}-${item.suggestedBy}`}
                      className="mb-3"
                    >
                      <QueueItem item={item} />
                    </div>
                  ),
                )}
                {processing.length === 0 && (
                  <div className="text-muted-foreground py-12 text-center">
                    No accounts being processed
                  </div>
                )}
              </CardContent>
            </TabsContent>

            {/* Complete Tab */}
            <TabsContent value="complete">
              <CardContent>
                {recentlyCompleted.length === 0 ? (
                  <div className="text-muted-foreground py-12 text-center">
                    <p>No recently completed accounts</p>
                    <p className="mt-1 text-xs">
                      (Showing accounts completed in the last 24 hours)
                    </p>
                  </div>
                ) : (
                  <>
                    {getUserAccounts(recentlyCompleted).map((item) => (
                      <div
                        key={`${item.username}-${item.suggestedBy}`}
                        className="mb-3"
                      >
                        <QueueItem item={item} />
                      </div>
                    ))}
                    {getOtherAccounts(
                      recentlyCompleted,
                      getUserAccounts(recentlyCompleted),
                    ).map((item) => (
                      <div
                        key={`${item.username}-${item.suggestedBy}`}
                        className="mb-3"
                      >
                        <QueueItem item={item} />
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </TabsContent>

            {hasUserAccounts && (
              <TabsContent value="mine">
                <CardContent>
                  {userQueue.map((item) => (
                    <div
                      key={`${item.username}-${item.suggestedBy}`}
                      className="mb-3"
                    >
                      <QueueItem item={item} />
                    </div>
                  ))}
                </CardContent>
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </div>

      {/* Bottom border */}
      <div className="border-border relative mt-4 border-t" />
    </div>
  );
}
