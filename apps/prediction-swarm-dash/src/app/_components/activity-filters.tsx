"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@torus-ts/ui/components/toggle-group";
import type { ActivityType } from "./activity-type-selector";

// Topic filter types
export type TopicFilter = "all" | "crypto" | "finance" | "politics" | "sports";

// Claims filter types
export type ClaimsFilter =
  | "all"
  | "NotMatured"
  | "MaturedTrue"
  | "MaturedFalse"
  | "MaturedMostlyTrue"
  | "Invalid"
  | "MissingContext";

// Combined filter state
export interface FilterState {
  topic: TopicFilter;
  claims?: ClaimsFilter;
}

interface ActivityFiltersProps {
  activityType: ActivityType;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

const TOPICS: { value: TopicFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "crypto", label: "Crypto" },
  { value: "finance", label: "Finance" },
  { value: "politics", label: "Politics" },
  { value: "sports", label: "Sports" },
];

const CLAIMS: { value: ClaimsFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "MaturedTrue", label: "Matured True" },
  { value: "MaturedFalse", label: "Matured False" },
];

export function ActivityFilters({
  activityType,
  filters,
  onFiltersChange,
  className,
}: ActivityFiltersProps) {
  const handleTopicChange = (value: string) => {
    if (value && value !== filters.topic) {
      onFiltersChange({
        ...filters,
        topic: value as TopicFilter,
      });
    }
  };

  const handleClaimsChange = (value: string) => {
    if (value !== filters.claims) {
      onFiltersChange({
        ...filters,
        claims: value as ClaimsFilter,
      });
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className || ""}`}>
      {/* Topic Filter - only for predictions */}
      {activityType === "predictions" && (
        <>
          {/* Mobile: Select */}
          <div className="md:hidden">
            <Select value={filters.topic} onValueChange={handleTopicChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((topic) => (
                  <SelectItem key={topic.value} value={topic.value}>
                    {topic.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Toggle Group */}
          <div className="hidden md:block">
            <ToggleGroup
              variant="outline"
              type="single"
              value={filters.topic}
              onValueChange={handleTopicChange}
            >
              {TOPICS.map((topic) => (
                <ToggleGroupItem key={topic.value} value={topic.value}>
                  <span className="px-4">{topic.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </>
      )}

      {/* Claims Filter - only for claims */}
      {activityType === "claims" && (
        <>
          {/* Mobile: Select */}
          <div className="md:hidden">
            <Select
              value={filters.claims || "all"}
              onValueChange={handleClaimsChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select claim status" />
              </SelectTrigger>
              <SelectContent>
                {CLAIMS.map((claim) => (
                  <SelectItem key={claim.value} value={claim.value}>
                    {claim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Toggle Group */}
          <div className="hidden md:block">
            <ToggleGroup
              variant="outline"
              type="single"
              value={filters.claims || "all"}
              onValueChange={handleClaimsChange}
            >
              {CLAIMS.map((claim) => (
                <ToggleGroupItem key={claim.value} value={claim.value}>
                  <span className="px-4">{claim.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </>
      )}
    </div>
  );
}
