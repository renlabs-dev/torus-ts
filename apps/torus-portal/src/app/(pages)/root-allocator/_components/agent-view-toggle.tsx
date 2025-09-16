"use client";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@torus-ts/ui/components/toggle-group";
import { useRouter, useSearchParams } from "next/navigation";

export type AgentView = "all" | "root" | "new" | "oldest";

interface AgentViewToggleProps {
  currentView?: AgentView;
}

export function AgentViewToggle({ currentView }: AgentViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleViewChange = (value: AgentView) => {
    const params = new URLSearchParams(searchParams);
    params.set("view", value);

    // Keep existing search params
    const newUrl = `/root-allocator?${params.toString()}`;
    router.push(newUrl);
  };

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={currentView ?? "all"}
      onValueChange={handleViewChange as (value: string) => void}
      className="grid w-full grid-cols-4 md:w-full md:max-w-72"
    >
      <ToggleGroupItem value="all">All</ToggleGroupItem>
      <ToggleGroupItem value="root">Root</ToggleGroupItem>
      <ToggleGroupItem value="new">New</ToggleGroupItem>
      <ToggleGroupItem value="oldest">Old</ToggleGroupItem>
    </ToggleGroup>
  );
}
