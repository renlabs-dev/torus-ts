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
          <div className="p-3">
            <Calendar
              mode="range"
              selected={dateRange}
              captionLayout="dropdown"
              numberOfMonths={2}
              onSelect={(range) => {
                onDateRangeChange(range);
              }}
              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            />
            <div className="flex justify-between gap-2 mt-4 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDateRangeChange(undefined);
                  setOpen(false);
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setOpen(false)}
                disabled={!dateRange?.from}
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
