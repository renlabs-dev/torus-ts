"use client";

import { Input } from "@torus-ts/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterContentProps {
  statusOptions?: FilterOption[];
  typeOptions?: FilterOption[];
  defaultStatus?: string;
  defaultType?: string;
  placeholder?: string;
  statusParamName?: string;
}

const defaultAgentStatusOptions: FilterOption[] = [
  { label: "All", value: "all" },
  { label: "Healthy", value: "healthy" },
  { label: "Penalized", value: "penalized" },
];

const defaultProposalStatusOptions: FilterOption[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
  { label: "Expired", value: "expired" },
];

const defaultApplicationStatusOptions: FilterOption[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Accepted", value: "accepted" },
  { label: "Refused", value: "refused" },
  { label: "Expired", value: "expired" },
];

export function FilterContent({
  statusOptions,
  defaultStatus = "all",
  placeholder,
  statusParamName = "status",
}: FilterContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  // Determine which filter options to use based on the current page
  const { filterOptions, searchPlaceholder } = useMemo(() => {
    if (pathname.includes("/proposals")) {
      return {
        filterOptions: statusOptions ?? defaultProposalStatusOptions,
        searchPlaceholder: placeholder ?? "Search proposals...",
      };
    } else if (pathname.includes("/agents")) {
      return {
        filterOptions: statusOptions ?? defaultAgentStatusOptions,
        searchPlaceholder: placeholder ?? "Search agents...",
      };
    } else {
      // Default for agent applications or other pages
      return {
        filterOptions: statusOptions ?? defaultApplicationStatusOptions,
        searchPlaceholder: placeholder ?? "Search applications...",
      };
    }
  }, [pathname, statusOptions, placeholder]);

  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get(statusParamName) ?? defaultStatus,
  );

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });

      return newParams.toString();
    },
    [searchParams],
  );

  const updateFilters = useCallback(() => {
    const query = createQueryString({
      search: search || null,
      [statusParamName]:
        selectedStatus === defaultStatus ? null : selectedStatus,
    });

    router.push(`?${query}`);
  }, [
    search,
    selectedStatus,
    router,
    createQueryString,
    defaultStatus,
    statusParamName,
  ]);

  useEffect(() => {
    updateFilters();
  }, [search, selectedStatus, updateFilters]);

  return (
    <div className="flex w-full gap-3">
      <Input
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full"
      />

      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
