"use client";

import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@torus-ts/ui/components/popover";
import {
  RadioGroup,
  RadioGroupItem,
} from "@torus-ts/ui/components/radio-group";
import { FilterIcon, X } from "lucide-react";
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

  const [open, setOpen] = useState(false);

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

  const hasFilters = selectedStatus !== defaultStatus;

  const activeFiltersCount = selectedStatus !== defaultStatus ? 1 : 0;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full gap-2">
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-2/3"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <FilterIcon size={18} />
              {activeFiltersCount > 0 && (
                <span className="bg-primary text-primary-foreground absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px]">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <RadioGroup
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              className="grid grid-cols-2 gap-2"
            >
              {filterOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`status-${option.value}`}
                  />
                  <Label htmlFor={`status-${option.value}`}>
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </PopoverContent>
        </Popover>
        {hasFilters && (
          <div className="hidden flex-nowrap gap-2 sm:flex">
            {selectedStatus !== defaultStatus && (
              <Badge className="flex items-center gap-1 text-nowrap">
                Status:{" "}
                {
                  filterOptions.find((opt) => opt.value === selectedStatus)
                    ?.label
                }
                <X
                  size={14}
                  className="cursor-pointer"
                  onClick={() => setSelectedStatus(defaultStatus)}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
