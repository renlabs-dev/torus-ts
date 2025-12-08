"use client";

import { Button } from "@torus-ts/ui/components/button";
import { Calendar } from "@torus-ts/ui/components/calendar";
import { Label } from "@torus-ts/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@torus-ts/ui/components/popover";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

interface FilterDatePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function ContentFilterDialogDatePicker({
  dateRange,
  onDateRangeChange,
}: FilterDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const formatDateRange = () => {
    if (!dateRange?.from) return "Select date range";
    if (!dateRange.to) return dateRange.from.toLocaleDateString();
    return `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`;
  };

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="date" className="px-1">
        Time Range
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="w-full justify-between font-normal"
          >
            {formatDateRange()}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            captionLayout="dropdown"
            onSelect={(range) => {
              onDateRangeChange(range);
              if (range?.from && range.to) {
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
