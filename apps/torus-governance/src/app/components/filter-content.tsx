"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui";
import { useGovernance } from "~/context/governance-provider";

export const SearchBar = () => {
  const { isInitialized } = useGovernance();
  const searchParams = useSearchParams();
  const router = useRouter();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (!search) {
      params.delete("search");
      return router.push(`/?${params.toString()}`);
    }

    const query = createQueryString("search", search);

    router.push(`/?${query}`);
  };

  return (
    <div className="rounded-radius flex w-full items-center justify-center border bg-card pl-3 lg:w-3/5">
      <SearchIcon
        size={16}
        className={`${!isInitialized && "cursor-not-allowed opacity-50"} animate-ease-in-out`}
      />
      <Input
        disabled={!isInitialized}
        onChange={handleSearchChange}
        placeholder="Search"
        className="border-none animate-ease-in-out focus-visible:ring-0"
      />
    </div>
  );
};

const WhitelistFilter = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isWhitelistApplication =
    searchParams.get("view") === "agent-applications";

  if (!isWhitelistApplication) return null;

  const handleSelectWhitelistStatus = (selectedValue: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!selectedValue) {
      params.delete("whitelist-status");
      return router.push(`/?${params.toString()}`);
    }

    params.set("whitelist-status", selectedValue);

    router.push(`/?${params.toString()}`);
  };

  return (
    <>
      <Select onValueChange={(e) => handleSelectWhitelistStatus(e)}>
        <SelectTrigger className="w-[180px] bg-card outline-none">
          <SelectValue placeholder="Select a status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="accepted">Accepted</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
};

export const FilterContent = () => {
  return (
    <Suspense>
      <SearchBar />
      <WhitelistFilter />
    </Suspense>
  );
};
