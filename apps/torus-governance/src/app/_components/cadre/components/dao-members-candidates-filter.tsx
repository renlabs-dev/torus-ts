"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup,
} from "@torus-ts/ui/components/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useGovernance } from "~/context/governance-provider";

// Define the possible status values
type StatusType = "Pending" | "DAO Members" | "Rejected" | "Removed";
type ViewType = "agent-applications" | "dao-portal";

const statusOptions: StatusType[] = [
  "Pending",
  "DAO Members",
  "Rejected",
  "Removed",
];

const FilterDaoContent = () => {
  const { isInitialized } = useGovernance();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") as ViewType | null;
  const currentStatus = searchParams.get("status") ?? "pending";

  const { isUserCadre } = useGovernance();

  // Only show for agent applications or authenticated users in DAO portal
  const shouldShowFilter = currentView === "dao-portal" && isUserCadre;

  if (!shouldShowFilter) return null;

  // Find the matching status option for display
  const displayStatus =
    statusOptions.find(
      (status) => status.toLowerCase() === currentStatus.toLowerCase(),
    ) ?? "Pending";

  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("status", newStatus.toLowerCase());

    router.push(`/?${params.toString()}`);
  };

  return (
    <Select
      onValueChange={handleStatusChange}
      disabled={!isInitialized}
      value={currentStatus}
    >
      <SelectTrigger className="bg-card rounded-radius w-full border p-3 outline-none lg:w-[180px]">
        <SelectValue placeholder="Filter by status">
          {displayStatus}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status.toLowerCase()}>
              <SelectLabel>{status}</SelectLabel>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default FilterDaoContent;
