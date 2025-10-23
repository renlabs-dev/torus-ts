"use client";

import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { api } from "~/trpc/react";
import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

export function SearchProphet() {
  const id = useId();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isForceClosed, setIsForceClosed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading } = api.twitterUser.search.useQuery(
    { query: debouncedQuery, limit: 10 },
    { enabled: debouncedQuery.length > 0 },
  );

  const hasResults = Boolean(searchResults?.length);
  const isOpen =
    !isForceClosed && debouncedQuery.length > 0 && (isLoading || hasResults);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsForceClosed(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (debouncedQuery) setIsForceClosed(false);
  }, [debouncedQuery]);

  const handleSelectUser = (username: string | null) => {
    if (!username) return;
    router.push(`/user/${username}`);
    setSearchQuery("");
    setIsForceClosed(true);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!searchResults?.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSelectUser(searchResults[selectedIndex]?.username ?? null);
        }
        break;
      case "Escape":
        setIsForceClosed(true);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-lg space-y-2 text-center"
    >
      <div className="shadow-xs flex rounded-full">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-6 top-1/2 z-10 h-5 w-5 -translate-y-1/2" />
          <Input
            id={id}
            placeholder="Search for any x account"
            className="focus-visible:z-1 -me-px h-12 bg-transparent pl-14 shadow-none backdrop-blur-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {isOpen && (
            <div className="bg-background/95 absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border shadow-lg backdrop-blur-xl">
              {isLoading ? (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  Searching...
                </div>
              ) : searchResults?.length ? (
                <div className="py-2">
                  {searchResults.map((user, index) => (
                    <button
                      key={user.userId}
                      onClick={() => handleSelectUser(user.username)}
                      className={`hover:bg-accent flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${index === selectedIndex ? "bg-accent" : ""}`}
                    >
                      {user.avatarUrl && (
                        <Image
                          src={user.avatarUrl}
                          alt={user.username ?? ""}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full"
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
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  No users found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Label htmlFor={id} className="text-muted-foreground text-sm">
        View prediction history, current and account breakdown
      </Label>
    </div>
  );
}
