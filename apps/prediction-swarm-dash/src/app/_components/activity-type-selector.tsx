"use client";

import { Badge } from "@torus-ts/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { cn } from "@torus-ts/ui/lib/utils";
import { CheckCircle, ClipboardList, FileText, Gavel } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "./tabs";

export type ActivityType = "predictions" | "claims" | "verdicts" | "tasks";

interface ActivityTypeSelectorProps {
  value: ActivityType;
  onValueChange: (value: ActivityType) => void;
  className?: string;
  showCounts?: {
    predictions?: number;
    claims?: number;
    verdicts?: number;
    tasks?: number;
  };
}

const activityTypes = [
  {
    value: "predictions" as const,
    label: "Predictions",
    icon: FileText,
    description: "Submitted predictions",
  },
  {
    value: "claims" as const,
    label: "Claims",
    icon: CheckCircle,
    description: "Verification claims",
  },
  {
    value: "verdicts" as const,
    label: "Verdicts",
    icon: Gavel,
    description: "Verification verdicts",
  },
  {
    value: "tasks" as const,
    label: "Tasks",
    icon: ClipboardList,
    description: "Completed tasks",
  },
];

export function ActivityTypeSelector({
  value,
  onValueChange,
  className,
  showCounts,
}: ActivityTypeSelectorProps) {
  const currentType = activityTypes.find((t) => t.value === value);

  return (
    <>
      {/* Mobile: Select Dropdown */}
      <div className={cn("w-full md:hidden", className)}>
        <Select
          value={value}
          onValueChange={(val) => onValueChange(val as ActivityType)}
        >
          <SelectTrigger className="mb-2 w-full">
            <SelectValue>
              <div className="flex items-center gap-2">
                {currentType && <currentType.icon className="h-4 w-4" />}
                <span className="font-medium">{currentType?.label}</span>
                {showCounts && (
                  <Badge className="ml-auto text-xs">
                    {showCounts[value] || 0}
                  </Badge>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {activityTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex w-full items-center gap-2">
                  <type.icon className="h-4 w-4" />
                  <span className="font-medium">{type.label}</span>
                  {showCounts && (
                    <Badge className="ml-auto text-xs">
                      {showCounts[type.value] || 0}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Tabs */}
      <Tabs
        value={value}
        onValueChange={(val) => onValueChange(val as ActivityType)}
        className={cn("hidden w-full md:block", className)}
      >
        <TabsList className="grid w-full grid-cols-4 bg-transparent">
          {activityTypes.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              <div className="mb-1 flex items-center gap-2">
                <type.icon className="h-4 w-4" />
                <span className="font-medium">{type.label}</span>
              </div>

              {showCounts && (
                <Badge className="mb-1 text-xs">
                  {showCounts[type.value] || 0}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </>
  );
}

// Helper function to get activity type info
export function getActivityTypeInfo(type: ActivityType) {
  return activityTypes.find((t) => t.value === type);
}
