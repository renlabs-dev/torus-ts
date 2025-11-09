"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { api } from "~/trpc/react";
import { QueueItem } from "~/app/_components/scraper-queue/queue-item";
import { Loader2 } from "lucide-react";

export default function ScraperQueuePage() {
  const { selectedAccount, isAccountConnected } = useTorus();
  const { data: queue, isLoading } = api.scraperQueue.getQueueStatus.useQuery();

  // Separate user's accounts from general queue
  const userAccounts = queue?.filter(
    (item) =>
      isAccountConnected &&
      selectedAccount?.address &&
      item.suggestedBy === selectedAccount.address,
  ) ?? [];

  const otherAccounts = queue?.filter(
    (item) => !userAccounts.find((u) => u.username === item.username),
  ) ?? [];

  return (
    <div className="relative py-10">
      {/* Vertical borders */}
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />

      {/* Header */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <div className="pb-8">
          <h1 className="text-3xl font-bold">Scraper Queue</h1>
          <p className="text-muted-foreground mt-2">
            Track the progress of accounts being added to the swarm
          </p>
        </div>
      </div>

      {/* Border */}
      <div className="border-border relative my-6 border-t" />

      {/* Content */}
      <div className="relative mx-auto max-w-screen-lg space-y-8 px-4">
        {/* User's Accounts Section */}
        {!isAccountConnected ? (
          <div className="bg-background/80 rounded-lg border p-8 text-center">
            <div className="text-muted-foreground">
              <p className="mb-2 text-lg font-medium">Connect Your Wallet</p>
              <p className="text-sm">
                Connect your wallet to view accounts you've added to the queue
              </p>
            </div>
          </div>
        ) : userAccounts.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Accounts</h2>
            <div className="space-y-3">
              {userAccounts.map((item) => (
                <QueueItem
                  key={`${item.username}-${item.suggestedBy}`}
                  item={item}
                  isUserAccount
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* All Queue Section */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              All Scraping Queue ({otherAccounts.length})
            </h2>
            {otherAccounts.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center">
                <p>No accounts in queue</p>
              </div>
            ) : (
              <div className="space-y-3">
                {otherAccounts.map((item) => (
                  <QueueItem
                    key={`${item.username}-${item.suggestedBy}`}
                    item={item}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom border */}
      <div className="border-border relative mt-10 border-t" />
    </div>
  );
}
