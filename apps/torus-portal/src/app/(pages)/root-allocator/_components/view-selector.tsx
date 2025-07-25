"use client";

import { useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";

const views = [
  { label: "Root Agents", value: "/root-allocator" },
  { label: "New Root Agents", value: "/root-allocator/new-agents" },
  { label: "My Allocated Agents", value: "/root-allocator/allocated-agents" },
  { label: "Registered Agents", value: "/root-allocator/?isWhitelisted=false" },
];

export function ViewSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInitialView = () => {
    const isWhitelisted = searchParams.get("isWhitelisted");
    if (pathname === "/root-allocator" && isWhitelisted === "false") {
      return "/root-allocator/?isWhitelisted=false";
    }
    const matchingView = views.find((view) => view.value === pathname);
    return matchingView ? matchingView.value : "/root-allocator";
  };

  const [currentView, setCurrentView] = useState(getInitialView());

  const handleViewChange = (value: string) => {
    setCurrentView(value);
    router.push(value);
  };

  return (
    <div className="flex w-full items-center md:w-fit">
      <Select value={currentView} onValueChange={handleViewChange}>
        <SelectTrigger className="min-w-full md:w-[210px]">
          <SelectValue placeholder="Select view" />
        </SelectTrigger>
        <SelectContent>
          {views.map((view) => (
            <SelectItem key={view.value} value={view.value}>
              {view.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
