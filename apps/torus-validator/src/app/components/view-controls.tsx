"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type SortField =
  | "id"
  | "emission"
  | "incentive"
  | "dividend"
  | "delegationFee"
  | "totalStakers"
  | "totalStaked"
  | "totalRewards"
  | "createdAt";

type SortOrder = "asc" | "desc";

const sortFieldLabels: Record<SortField, string> = {
  id: "ID",
  emission: "Emission",
  incentive: "Incentive",
  dividend: "Dividend",
  delegationFee: "Delegation Fee",
  totalStakers: "Total Stakers",
  totalStaked: "Total Staked",
  totalRewards: "Total Rewards",
  createdAt: "Creation Date",
};

export function ViewControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortField, setSortField] = useState<SortField>(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (searchParams.get("sortBy") as SortField) ?? "id",
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (searchParams.get("order") as SortOrder) ?? "asc",
  );

  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("sortBy", sortField);
    newSearchParams.set("order", sortOrder);
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  }, [sortField, sortOrder, router, searchParams]);

  const handleSortChange = (field: SortField) => {
    const newOrder =
      field === sortField && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(newOrder);
  };

  return (
    <div className="mb-4 flex w-full animate-fade-down flex-col items-center justify-between gap-2 border-b border-white/20 pb-4 animate-delay-200 md:flex-row">
      <span className="w-full text-white">Sort by:</span>
      {(Object.keys(sortFieldLabels) as SortField[]).map((field) => (
        <button
          key={field}
          onClick={() => handleSortChange(field)}
          className={`w-full py-1 text-sm ${
            sortField === field
              ? "border border-green-500 bg-green-500/20 text-white"
              : "border border-white/20 bg-[#898989]/5 text-gray-300 hover:bg-gray-600/50"
          }`}
        >
          {sortFieldLabels[field]}{" "}
          {sortField === field && (sortOrder === "asc" ? "↑" : "↓")}
        </button>
      ))}
    </div>
  );
}
