"use client";

import { CheckCircle, ClipboardList, FileText, Gavel } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

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
      <div className={cn("md:hidden w-full", className)}>
        <Select
          value={value}
          onValueChange={(val) => onValueChange(val as ActivityType)}
        >
          <SelectTrigger className="w-full mb-2">
            <SelectValue>
              <div className="flex items-center gap-2">
                {currentType && <currentType.icon className="h-4 w-4" />}
                <span className="font-medium">{currentType?.label}</span>
                {showCounts && (
                  <Badge className="text-xs ml-auto">
                    {showCounts[value] || 0}
                  </Badge>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {activityTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2 w-full">
                  <type.icon className="h-4 w-4" />
                  <span className="font-medium">{type.label}</span>
                  {showCounts && (
                    <Badge className="text-xs ml-auto">
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
        className={cn("hidden md:block w-full", className)}
      >
        <TabsList className="grid grid-cols-4 w-full bg-transparent">
          {activityTypes.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              <div className="flex items-center gap-2 mb-1">
                <type.icon className="h-4 w-4" />
                <span className="font-medium">{type.label}</span>
              </div>

              {showCounts && (
                <Badge className="text-xs mb-1">
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
