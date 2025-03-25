"use client";

import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

interface FilterProps {
  defaultValue?: string;
  onSearch?: (query: string) => void;
  isClientSide?: boolean;
}

export const Filter = ({
  defaultValue = "",
  onSearch,
  isClientSide = false,
}: FilterProps) => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(defaultValue);
  const [hasSearched, setHasSearched] = useState(!!defaultValue);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setHasSearched(true);

    // If we have an onSearch callback (client-side filtering), use it
    if (isClientSide && onSearch) {
      onSearch(searchValue);
      return;
    }

    // Otherwise use URL-based filtering (server-side)
    const url = searchValue
      ? `/?search=${encodeURIComponent(searchValue)}&page=1`
      : "/?page=1";

    router.push(url);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    setSearchValue("");

    if (isClientSide && onSearch) {
      onSearch("");
      return;
    }

    router.push("/");
  };

  const showSearchInfo = isClientSide
    ? searchValue && hasSearched
    : defaultValue !== "";

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex w-full items-center gap-2">
          <Label
            htmlFor="search-bar"
            className="rounded-radius flex w-full max-w-sm flex-1 items-center justify-center border pl-3"
          >
            <SearchIcon size={16} className="text-muted-foreground" />
            <Input
              id="search-bar"
              placeholder="Search agents by name or key"
              className="border-none focus-visible:ring-0"
              value={searchValue}
              onChange={(e) => {
                const newValue = e.target.value;
                setSearchValue(newValue);
                // If client-side filtering is enabled, update as you type
                if (isClientSide && onSearch) {
                  onSearch(newValue);
                }
              }}
            />
          </Label>

          <Button type="submit" variant="outline" className="py-[1.3em]">
            Search
          </Button>

          {showSearchInfo && (
            <div className="text-sm">
              Showing results for:{" "}
              <span className="font-semibold">{searchValue}</span>
              <button
                onClick={handleClear}
                className="ml-2 text-blue-500 hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
