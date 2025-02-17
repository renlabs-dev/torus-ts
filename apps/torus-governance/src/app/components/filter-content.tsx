"use client";

import {
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui";
import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";
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

const whitelistStatus = ["All", "Active", "Accepted", "Refused", "Expired"];

const WhitelistFilter = () => {
  const { isInitialized } = useGovernance();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isWhitelistApplication =
    searchParams.get("view") === "agent-applications";

  const paramsStatus = searchParams.get("whitelist-status");

  useEffect(() => {
    if (!isWhitelistApplication) return;

    const params = new URLSearchParams(searchParams.toString());
    const isValidStatus = whitelistStatus
      .map((s) => s.toLowerCase())
      .includes(paramsStatus?.toLowerCase() ?? "");

    if (!isValidStatus) {
      params.set("whitelist-status", "all");
      router.replace(`/?${params.toString()}`);
    }
  }, [paramsStatus, router, searchParams, isWhitelistApplication]);

  if (!isWhitelistApplication) return;

  const handleSelectWhitelistStatus = (selectedValue: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedValue === "all") {
      params.delete("whitelist-status");
    } else {
      params.set("whitelist-status", selectedValue);
    }

    router.push(`/?${params.toString()}`);
  };

  return (
    <Select
      onValueChange={handleSelectWhitelistStatus}
      disabled={!isInitialized}
      value={paramsStatus ?? "all"}
    >
      <SelectTrigger className="w-full bg-card outline-none lg:w-[180px]">
        <SelectValue placeholder="Select a status" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {whitelistStatus.map((status) => (
            <SelectItem key={status} value={status.toLocaleLowerCase()}>
              <SelectLabel>{status}</SelectLabel>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
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
