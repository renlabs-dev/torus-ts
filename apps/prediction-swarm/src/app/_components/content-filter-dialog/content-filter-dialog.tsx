"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@torus-ts/ui/components/alert-dialog";
import { Button } from "@torus-ts/ui/components/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { ContentFilterDialogDatePicker } from "./content-filter-dialog-date-picker";
import { ContentFilterDialogTopicSelect } from "./content-filter-dialog-topic-select";

export function ContentFilterDialog() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial values from URL
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = searchParams.get("dateFrom");
    const to = searchParams.get("dateTo");
    if (from || to) {
      return {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      };
    }
    return undefined;
  });

  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(() => {
    const topics = searchParams.get("topics");
    return topics ? topics.split(",") : [];
  });

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams);

    // Update date range
    if (dateRange?.from) {
      params.set("dateFrom", dateRange.from.toISOString());
    } else {
      params.delete("dateFrom");
    }
    if (dateRange?.to) {
      params.set("dateTo", dateRange.to.toISOString());
    } else {
      params.delete("dateTo");
    }

    // Update topics
    if (selectedTopicIds.length > 0) {
      params.set("topics", selectedTopicIds.join(","));
    } else {
      params.delete("topics");
    }

    // Reset to first page when filters change
    params.delete("page");

    router.push(`?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setDateRange(undefined);
    setSelectedTopicIds([]);
    const params = new URLSearchParams(searchParams);
    params.delete("dateFrom");
    params.delete("dateTo");
    params.delete("topics");
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const hasFilters =
    dateRange?.from !== undefined || selectedTopicIds.length > 0;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>
          Filters{" "}
          {hasFilters &&
            `(${(dateRange?.from ? 1 : 0) + (selectedTopicIds.length > 0 ? 1 : 0)})`}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Filter Predictions</AlertDialogTitle>
          <AlertDialogDescription>
            Select the filters you want to apply to your feed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          <ContentFilterDialogDatePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <ContentFilterDialogTopicSelect
            selectedTopicIds={selectedTopicIds}
            onTopicIdsChange={setSelectedTopicIds}
          />
        </div>
        <AlertDialogFooter>
          {hasFilters && (
            <Button variant="ghost" onClick={handleClearFilters}>
              Clear
            </Button>
          )}
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleApplyFilters}>
            Apply Filters
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
