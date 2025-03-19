"use client";

import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { SearchIcon } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

interface FilterProps {
  defaultValue?: string;
  onClientSearch?: (query: string) => void;
  isClientSide?: boolean;
}

export const Filter = ({
  defaultValue = "",
  onClientSearch,
  isClientSide = false,
}: FilterProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(defaultValue);
  const [hasSearched, setHasSearched] = useState(!!defaultValue);

  useEffect(() => {
    if (isClientSide && onClientSearch) {
      onClientSearch(searchValue);
    }
  }, [searchValue, isClientSide, onClientSearch]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setHasSearched(true);

    if (isClientSide && onClientSearch) {
      onClientSearch(searchValue);
      return;
    }

    const params = new URLSearchParams(searchParams);
    if (searchValue) {
      params.set("search", searchValue);
      params.set("page", "1");
    } else {
      params.delete("search");
      params.delete("page");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    setSearchValue("");
    setHasSearched(false);

    if (isClientSide && onClientSearch) {
      onClientSearch("");
      return;
    }

    router.push(pathname);
  };

  const showSearchInfo = isClientSide
    ? searchValue && hasSearched
    : defaultValue !== "";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex w-full items-center gap-2">
        <Label
          htmlFor="search-bar"
          className="rounded-radius flex w-full max-w-sm flex-1 items-center justify-center border pl-3"
        >
          <SearchIcon size={16} className="text-muted-foreground" />
          <Input
            id="search-bar"
            name="search"
            placeholder="Search agents by name or key"
            className="border-none focus-visible:ring-0"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </Label>

        <Button type="submit" variant="outline" className="py-[1.3em]">
          Search
        </Button>

        {showSearchInfo && (
          <div className="text-sm">
            Showing results for:{" "}
            <span className="font-semibold">
              {isClientSide ? searchValue : defaultValue}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="ml-2 text-blue-500 hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </form>
  );
};
