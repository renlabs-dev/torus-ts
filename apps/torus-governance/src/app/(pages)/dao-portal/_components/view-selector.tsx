"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import type { CandidacyStatus } from "~/utils/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const statusOptions = [
  { label: "Active Candidates", value: "PENDING" },
  { label: "DAO Curator Members", value: "ACCEPTED" },
  { label: "Rejected from DAO Curator", value: "REJECTED" },
  { label: "Removed from DAO Curator", value: "REMOVED" },
];

export function ViewSelector({
  currentStatus,
}: {
  currentStatus: CandidacyStatus;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(currentStatus);

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const handleStatusChange = (value: string) => {
    setStatus(value as CandidacyStatus);

    // Create a new URLSearchParams object
    const params = new URLSearchParams(searchParams);

    // Set the status parameter
    if (value === "PENDING") {
      params.delete("status"); // Remove parameter for default value
    } else {
      params.set("status", value);
    }

    // Push the new URL with updated parameters
    const newPath = `${pathname}?${params.toString()}`;

    // Use replace rather than push to avoid adding to history stack
    // Set scroll parameter to false to maintain scroll position
    router.replace(newPath, { scroll: false });
  };

  return (
    <div className="animate-fade-down animate-delay-200 flex w-full items-center md:w-fit">
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="min-w-full md:w-[240px]">
          <SelectValue placeholder="Select candidate status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
