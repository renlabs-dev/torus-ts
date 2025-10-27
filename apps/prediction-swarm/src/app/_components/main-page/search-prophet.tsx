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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SearchProphet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

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
    { enabled: search.length > 0 },
  );

  const handleSelectUser = (username: string | null) => {
    if (!username) return;
    setOpen(false);
    router.push(`/user/${username}`);
  };

  return (
    <>
      <div className="relative mx-auto w-full max-w-lg space-y-2 text-center">
        <button
          onClick={() => setOpen(true)}
          className="bg-background/80 text-muted-foreground hover:bg-background flex h-12 w-full items-center gap-3 rounded-lg border px-4 backdrop-blur-lg transition-colors"
        >
          <SearchIcon className="h-5 w-5" />
          <span className="flex-1 text-left">Search for any x account</span>
          <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
        <p className="text-muted-foreground text-sm">
          View prediction history, current and account breakdown
        </p>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder="Search for any x account..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No users found</CommandEmpty>
          {searchResults && searchResults.length > 0 && (
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
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
