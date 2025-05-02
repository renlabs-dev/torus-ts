"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const views = [
  { label: "All Agents", value: "/" },
  { label: "New Agents", value: "/new-agents" },
  { label: "My Allocated Agents", value: "/allocated-agents" },
];

export function ViewSelector() {
  const router = useRouter();
  const pathname = usePathname();

  const getInitialView = () => {
    const matchingView = views.find((view) => view.value === pathname);
    return matchingView ? matchingView.value : "/";
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
