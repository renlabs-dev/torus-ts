"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@torus-ts/ui/components/command";
import { api } from "~/trpc/react";
import { SearchIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProgressStages } from "../scraper-queue/progress-stages";
import { AddAccountModal } from "./add-account-modal";
import { SearchEmpty } from "./search-empty";

export function SearchProphet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [validationError, setValidationError] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [usernameToAdd, setUsernameToAdd] = useState("");

  // Validate and clean input
  const validateInput = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return { valid: true, cleaned: "" };

    // Remove @ symbol
    let cleaned = trimmed.replace(/^@/, "");

    // Check for Twitter URL
    const urlMatch = /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/.exec(cleaned);
    if (urlMatch) {
      cleaned = urlMatch[1] ?? cleaned;
    }

    // Validate format
    if (!/^[a-zA-Z0-9_]+$/.test(cleaned)) {
      return {
        valid: false,
        cleaned,
        error:
          "Invalid username format. Use only letters, numbers, and underscores.",
      };
    }

    return { valid: true, cleaned };
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const validation = validateInput(value);
    setValidationError(validation.valid ? "" : (validation.error ?? ""));
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: searchResults } = api.twitterUser.search.useQuery(
    { query: search, limit: 10 },
    { enabled: search.length > 0 && !validationError },
  );

  const { data: scrapingStatus } = api.twitterUser.getScrapingStatus.useQuery(
    { username: search },
    { enabled: search.length > 0 && searchResults?.length === 0 },
  );

  // Get queue data to show progress for scraping users
  const { data: queueData } = api.scraperQueue.getQueueStatus.useQuery(
    undefined,
    { enabled: scrapingStatus?.status === "scraping" },
  );

  const queueItem = queueData?.find(
    (item) => item.username.toLowerCase() === search.toLowerCase(),
  );

  const handleSelectUser = (username: string | null) => {
    if (!username) return;
    setOpen(false);
    router.push(`/user/${username}`);
  };

  return (
    <>
      <div className="relative mx-auto w-full max-w-lg space-y-2 text-center">
        <div className="plus-corners">
          <button
            onClick={() => setOpen(true)}
            className="bg-background/80 hover:bg-background/90 text-muted-foreground flex h-16 w-full items-center gap-3 rounded-lg border px-5 transition-colors"
          >
            <SearchIcon className="h-5 w-5" />
            <span className="flex-1 text-left text-lg">
              Search for any x account
            </span>
            <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>
        <p className="text-sm text-white/80">
          Track prediction activity, outcomes, and performance
        </p>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder="Search for any x account..."
          value={search}
          onValueChange={handleSearchChange}
        />
        {validationError && (
          <div className="border-t px-3 py-2">
            <p className="text-xs text-red-500">{validationError}</p>
          </div>
        )}
        <CommandList>
          {
            <>
              <CommandEmpty>
                {searchResults === undefined ? (
                  <div className="flex flex-col gap-2">
                    <SearchEmpty />
                  </div>
                ) : scrapingStatus?.status === "scraping" && queueItem ? (
                  <div className="flex flex-col items-center gap-4 px-4 py-8">
                    <div className="text-center">
                      <h3 className="mb-4 font-semibold">
                        @{search} is being processed
                      </h3>
                      <div className="scale-75">
                        <ProgressStages status={queueItem.status} />
                      </div>
                      <Link
                        href="/scraper-queue"
                        className="text-primary mt-4 inline-block text-sm underline"
                        onClick={() => setOpen(false)}
                      >
                        View full progress →
                      </Link>
                    </div>
                  </div>
                ) : scrapingStatus?.status === "scraping" ? (
                  <div className="flex flex-col items-center gap-4 px-4 py-8">
                    <div className="relative">
                      <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold">
                        @{search} is being processed
                      </h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        This account is currently being added to the swarm.
                      </p>
                      <Link
                        href="/scraper-queue"
                        className="text-primary mt-2 inline-block text-sm underline"
                        onClick={() => setOpen(false)}
                      >
                        Track progress →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <button
                      onClick={() => {
                        const validation = validateInput(search);
                        setUsernameToAdd(validation.cleaned);
                        setAddModalOpen(true);
                      }}
                      className="hover:bg-accent flex w-full items-center gap-3 rounded-lg p-3 transition-colors"
                    >
                      <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                        <span className="text-xl">+</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Add @{search}</div>
                        <div className="text-muted-foreground text-sm">
                          {scrapingStatus?.status === "untracked"
                            ? "Account exists but not tracked yet"
                            : "This account is not in the swarm yet"}
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </CommandEmpty>
              {searchResults && searchResults.length > 0 && (
                <>
                  {/* Show "Add account" if exact match doesn't exist */}
                  {(() => {
                    const validation = validateInput(search);
                    const exactMatch = searchResults.find(
                      (u) =>
                        u.username?.toLowerCase() ===
                        validation.cleaned.toLowerCase(),
                    );

                    if (!exactMatch && validation.valid && validation.cleaned) {
                      return (
                        <div className="border-b px-3 py-2">
                          <CommandItem
                            onSelect={() => {
                              setUsernameToAdd(validation.cleaned);
                              setAddModalOpen(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full">
                              <span className="text-lg">+</span>
                            </div>
                            <div>
                              <div className="font-medium">
                                Add @{validation.cleaned}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                This account is not in the swarm yet
                              </div>
                            </div>
                          </CommandItem>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <CommandGroup heading="Users">
                    {searchResults.map((user) => (
                      <CommandItem
                        key={user.userId}
                        onSelect={() => handleSelectUser(user.username)}
                        className="flex items-center gap-3"
                      >
                        {user.avatarUrl && (
                          <Image
                            src={user.avatarUrl}
                            alt={user.username ?? ""}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full"
                          />
                        )}
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {user.screenName ?? user.username}
                            </span>
                            {user.isVerified && (
                              <span className="text-xs text-blue-500">✓</span>
                            )}
                          </div>
                          {user.username && (
                            <div className="text-muted-foreground text-sm">
                              @{user.username}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          }
        </CommandList>
      </CommandDialog>

      <AddAccountModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        username={usernameToAdd}
      />
    </>
  );
}
