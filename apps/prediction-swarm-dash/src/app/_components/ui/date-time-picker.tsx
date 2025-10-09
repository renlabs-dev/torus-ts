"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

import { ChevronDownIcon } from "lucide-react";
import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "./button";

export function DateTimePicker({
  label = "Date/time",
  value,
  onChange,
  id,
  className,
  secondsMode = "start",
}: {
  label?: string;
  value?: Date;
  onChange?: (date?: Date) => void;
  id: string;
  className?: string;
  secondsMode?: "start" | "end";
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [time, setTime] = React.useState<string>(
    value ? dayjs(value).utc().format("HH:mm") : ""
  );

  // Sync local state when external value changes (no onChange here to avoid loops)
  React.useEffect(() => {
    if (value) {
      setDate(value);
      setTime(dayjs(value).utc().format("HH:mm"));
    } else {
      setDate(undefined);
      setTime("");
    }
  }, [value]);

  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-end">
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <Label htmlFor={`${id}-date`} className="px-1">
            {label}
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={`${id}-date`}
                variant="outline"
                className="w-full sm:w-40 justify-between font-norma"
              >
                {date ? date.toLocaleDateString() : "Select date"}
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                fromYear={2020}
                toYear={dayjs().utc().year() + 1}
                defaultMonth={date ?? new Date()}
                onSelect={(d) => {
                  if (!d) return;
                  setDate(d);
                  // Determine hours/minutes from current time state or defaults per mode
                  const defaultTime = secondsMode === "end" ? "23:59" : "00:00";
                  const [h = "00", m = "00"] = (time || defaultTime).split(":");
                  const seconds = secondsMode === "end" ? 59 : 0;
                  const millis = secondsMode === "end" ? 999 : 0;
                  const next = dayjs(d)
                    .utc()
                    .hour(Number(h))
                    .minute(Number(m))
                    .second(seconds)
                    .millisecond(millis)
                    .toDate();
                  onChange?.(next);
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <Label htmlFor={`${id}-time`} className="px-1">
            Time
          </Label>
          <Input
            type="time"
            id={`${id}-time`}
            step={60}
            value={time}
            onChange={(e) => {
              const v = e.target.value;
              setTime(v);
              if (date) {
                const [h = "00", m = "00"] = v.split(":");
                const seconds = secondsMode === "end" ? 59 : 0;
                const millis = secondsMode === "end" ? 999 : 0;
                const next = dayjs(date)
                  .utc()
                  .hour(Number(h))
                  .minute(Number(m))
                  .second(seconds)
                  .millisecond(millis)
                  .toDate();
                onChange?.(next);
              }
            }}
            placeholder="HH:MM"
            className="bg-transparent border border-border"
          />
        </div>
      </div>
    </div>
  );
}
