"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@torus-ts/ui/components/command";
import { useDebounce } from "@uidotdev/usehooks";
import { useSearchStore } from "~/store/search-store";
import { api } from "~/trpc/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScraperQueueItemCardProgressStages } from "../../(pages)/(expanded-pages)/scraper-queue/components/scraper-queue-item-card-progress-stages";
import AddAccountStepperDialog from "../add-account-stepper-dialog";
import { SearchPredictorCommandEmpty } from "./search-predictor-command-empty";

export function SearchPredictorCommand() {
  const router = useRouter();
  const { isOpen, open, close, toggle } = useSearchStore();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [validationError, setValidationError] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [usernameToAdd, setUsernameToAdd] = useState("");

  // Validate and clean input
  const validateInput = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return { valid: true, cleaned: "" };

    let cleaned = trimmed.replace(/^@/, "");
    const urlMatch = /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/.exec(cleaned);
    if (urlMatch) {
      cleaned = urlMatch[1] ?? cleaned;
    }

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

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggle]);

  const { data: searchResults, isLoading: isSearching } =
    api.twitterUser.search.useQuery(
      { query: debouncedSearch, limit: 10 },
      { enabled: debouncedSearch.length > 0 && !validationError },
    );

  const { data: scrapingStatus } = api.twitterUser.getScrapingStatus.useQuery(
    { username: debouncedSearch },
    { enabled: debouncedSearch.length > 0 && searchResults?.length === 0 },
  );

  const { data: queueData } = api.scraperQueue.getQueueStatus.useQuery(
    undefined,
    {
      enabled: scrapingStatus?.status === "scraping",
    },
  );

  const queueItem = queueData?.find(
    (item) => item.username.toLowerCase() === debouncedSearch.toLowerCase(),
  );

  const handleSelectUser = (username: string | null) => {
    if (!username) return;
    close();
    router.push(`/user/${username}`);
  };

  return (
    <>
      <CommandDialog
        open={isOpen}
        onOpenChange={(isOpen) => (isOpen ? open() : close())}
        shouldFilter={false}
      >
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
        {isSearching && search.length > 0 && (
          <div className="border-t px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
              <span className="text-muted-foreground text-xs">
                Searching...
              </span>
            </div>
          </div>
        )}
        <CommandList>
          <>
            {/* Show empty states for non-actionable scenarios */}
            {searchResults === undefined && (
              <CommandEmpty>
                <div className="flex flex-col gap-2">
                  <SearchPredictorCommandEmpty />
                </div>
              </CommandEmpty>
            )}
            {searchResults !== undefined &&
              searchResults.length === 0 &&
              scrapingStatus?.status === "scraping" &&
              queueItem && (
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-4 px-4 py-8">
                    <div className="text-center">
                      <h3 className="mb-4 font-semibold">
                        @{search} is being processed
                      </h3>
                      <div className="scale-75">
                        <ScraperQueueItemCardProgressStages
                          status={queueItem.status}
                        />
                      </div>
                      <Link
                        href="/scraper-queue"
                        className="text-primary mt-4 inline-block text-sm underline"
                        onClick={close}
                      >
                        View full progress →
                      </Link>
                    </div>
                  </div>
                </CommandEmpty>
              )}
            {searchResults !== undefined &&
              searchResults.length === 0 &&
              scrapingStatus?.status === "scraping" &&
              !queueItem && (
                <CommandEmpty>
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
                        onClick={close}
                      >
                        Track progress →
                      </Link>
                    </div>
                  </div>
                </CommandEmpty>
              )}

            {/* Show "Add" option as regular CommandItem when no results and not scraping */}
            {searchResults !== undefined &&
              searchResults.length === 0 &&
              scrapingStatus?.status !== "scraping" &&
              search.length > 0 && (
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      const validation = validateInput(search);
                      setUsernameToAdd(validation.cleaned);
                      setAddModalOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full">
                      <span className="text-lg">+</span>
                    </div>
                    <div>
                      <div className="font-medium">Add @{search}</div>
                      <div className="text-muted-foreground text-xs">
                        {scrapingStatus?.status === "untracked"
                          ? "Account exists but not tracked yet"
                          : "This account is not in the swarm yet"}
                      </div>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}

            {/* Show results with optional "Add" action and user list */}
            {searchResults && searchResults.length > 0 && (
              <>
                {(() => {
                  const validation = validateInput(search);
                  const exactMatch = searchResults.find(
                    (u) =>
                      u.username?.toLowerCase() ===
                      validation.cleaned.toLowerCase(),
                  );

                  if (!exactMatch && validation.valid && validation.cleaned) {
                    return (
                      <CommandGroup>
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
                      </CommandGroup>
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
        </CommandList>
      </CommandDialog>

      <AddAccountStepperDialog
        open={addModalOpen}
        onOpenChange={(open) => {
          setAddModalOpen(open);
          if (!open) setUsernameToAdd("");
        }}
        initialUsername={usernameToAdd}
        showTrigger={false}
      />
    </>
  );
}
