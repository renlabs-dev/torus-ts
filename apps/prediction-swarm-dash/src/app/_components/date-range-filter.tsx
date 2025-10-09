"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import type { TimeWindowParams } from "~/lib/api-schemas";
import {
  createLastDaysTimeWindow,
  createLastHoursTimeWindow,
  createTodayTimeWindow,
} from "~/lib/api-utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Filter, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { DateTimePicker } from "./date-time-picker";

dayjs.extend(utc);

const dateRangeFilterSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
  limit: z.number().int().positive().max(100).optional(),
  agent_address: z.string().optional(),
  query: z.string().optional(),
  activity_type: z
    .enum(["predictions", "claims", "verdicts", "tasks", "all"])
    .optional(),
});

export type DateRangeFilterData = z.infer<typeof dateRangeFilterSchema>;
export type SearchFormData = DateRangeFilterData;
export { DateRangeFilter as SearchFormv2 };
export type { SearchFormData as SearchFormDataV2 };

interface DateRangeFilterProps {
  onSubmit: (data: DateRangeFilterData) => void;
  defaultValues?: Partial<DateRangeFilterData>;
  isLoading?: boolean;
}

export function DateRangeFilter({
  onSubmit,
  defaultValues,
  isLoading = false,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<DateRangeFilterData>({
    resolver: zodResolver(dateRangeFilterSchema),
    defaultValues: {
      from: undefined,
      to: undefined,
      ...defaultValues,
    },
  });

  const watchedFromValue = useWatch({ control: form.control, name: "from" });
  const watchedToValue = useWatch({ control: form.control, name: "to" });

  const activeButton = useMemo(() => {
    const now = dayjs().utc();
    const from = watchedFromValue ? dayjs(watchedFromValue).utc() : null;
    const to = watchedToValue ? dayjs(watchedToValue).utc() : null;

    // All Time
    if (!from && !to) return "all";

    // Hour-based presets
    if (from && to) {
      const isToNow = to.isAfter(now.subtract(1, "minute"));
      const hoursDiff = now.diff(from, "hour", true);

      if (isToNow) {
        if (Math.abs(hoursDiff - 3) < 0.1) return "3h";
        if (Math.abs(hoursDiff - 6) < 0.1) return "6h";
        if (Math.abs(hoursDiff - 12) < 0.1) return "12h";
      }
    }

    // Day-based presets
    if (from && to) {
      const startOfDay = (d: dayjs.Dayjs) => d.startOf("day");
      const endOfDay = (d: dayjs.Dayjs) => d.endOf("day");

      const isFullDayRange =
        from.isSame(startOfDay(from)) && to.isSame(endOfDay(to));

      if (isFullDayRange) {
        const daysDiff = now.startOf("day").diff(from, "day");

        if (daysDiff === 0) return "today";
        if (daysDiff === 7) return "7d";
        if (daysDiff === 30) return "30d";
        if (daysDiff === 90) return "90d";
      }
    }

    return null;
  }, [watchedFromValue, watchedToValue]);

  const handleSubmit = useCallback(
    (data: DateRangeFilterData) => {
      if (activeButton === "all") {
        onSubmit({ ...data, from: undefined, to: undefined });
        setOpen(false);
        return;
      }

      const isDayPreset = ["today", "7d", "30d", "90d"].includes(
        activeButton || "",
      );

      if (isDayPreset) {
        const normalized = {
          ...data,
          from: data.from
            ? dayjs(data.from).utc().startOf("day").toDate()
            : undefined,
          to: data.to ? dayjs(data.to).utc().endOf("day").toDate() : undefined,
        };
        onSubmit(normalized);
        setOpen(false);
        return;
      }

      onSubmit(data);
      setOpen(false);
    },
    [activeButton, onSubmit],
  );

  const setFastDate = useCallback(
    (timeWindow: TimeWindowParams) => {
      form.setValue(
        "from",
        timeWindow.from ? new Date(timeWindow.from) : undefined,
      );
      form.setValue("to", timeWindow.to ? new Date(timeWindow.to) : undefined);
    },
    [form],
  );

  // Individual handlers for hour buttons
  const handle3Hours = useCallback(
    () => setFastDate(createLastHoursTimeWindow(3)),
    [setFastDate],
  );
  const handle6Hours = useCallback(
    () => setFastDate(createLastHoursTimeWindow(6)),
    [setFastDate],
  );
  const handle12Hours = useCallback(
    () => setFastDate(createLastHoursTimeWindow(12)),
    [setFastDate],
  );

  // Individual handlers for period buttons
  const handle7Days = useCallback(
    () => setFastDate(createLastDaysTimeWindow(7)),
    [setFastDate],
  );
  const handle30Days = useCallback(
    () => setFastDate(createLastDaysTimeWindow(30)),
    [setFastDate],
  );
  const handle90Days = useCallback(
    () => setFastDate(createLastDaysTimeWindow(90)),
    [setFastDate],
  );
  const handleToday = useCallback(
    () => setFastDate(createTodayTimeWindow()),
    [setFastDate],
  );
  const handleAllTime = useCallback(() => {
    form.setValue("from", undefined);
    form.setValue("to", undefined);
  }, [form]);

  // Handler maps
  const hourHandlerMap = useMemo(
    () => ({
      "3h": handle3Hours,
      "6h": handle6Hours,
      "12h": handle12Hours,
    }),
    [handle3Hours, handle6Hours, handle12Hours],
  );

  const periodHandlerMap = useMemo(
    () => ({
      "7d": handle7Days,
      "30d": handle30Days,
      "90d": handle90Days,
      today: handleToday,
      all: handleAllTime,
    }),
    [handle7Days, handle30Days, handle90Days, handleToday, handleAllTime],
  );

  const getPeriodText = useCallback((period: string) => {
    if (period === "today") return "Today";
    if (period === "all") return "All";
    return period;
  }, []);

  const getFilterDescription = useMemo(() => {
    if (activeButton === "all" || (!watchedFromValue && !watchedToValue)) {
      return "All time";
    }

    if (activeButton) {
      const buttonText = getPeriodText(activeButton);
      return `Last ${buttonText}`;
    }

    if (watchedFromValue && watchedToValue) {
      return `Custom range`;
    }

    if (watchedFromValue) {
      return `From ${dayjs(watchedFromValue).format("MMM D, YYYY")}`;
    }

    if (watchedToValue) {
      return `Until ${dayjs(watchedToValue).format("MMM D, YYYY")}`;
    }

    return "All time";
  }, [activeButton, watchedFromValue, watchedToValue, getPeriodText]);

  // Style for active buttons
  const getButtonVariant = (buttonId: string) =>
    activeButton === buttonId ? "border border-primary" : "";

  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground text-sm">
        Showing:{" "}
        <span className="text-foreground font-medium">
          {getFilterDescription}
        </span>
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            variant="outline"
            className="border-border cursor-pointer border"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Filter Data</DialogTitle>
            <DialogDescription>
              Set date range and filters to refine your data view
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="flex flex-col flex-wrap gap-4 md:flex-row">
                <FormField
                  control={form.control}
                  name="from"
                  render={({ field }) => (
                    <FormItem className="w-full md:w-auto md:flex-shrink-0">
                      <FormControl>
                        <DateTimePicker
                          id="from-datetime"
                          label="Start"
                          value={field.value}
                          onChange={field.onChange}
                          secondsMode="start"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="to"
                  render={({ field }) => (
                    <FormItem className="w-full md:w-auto md:flex-shrink-0">
                      <FormControl>
                        <DateTimePicker
                          id="to-datetime"
                          label="End"
                          value={field.value}
                          onChange={field.onChange}
                          secondsMode="end"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex w-full flex-wrap items-end gap-1 md:w-auto">
                  {["3h", "6h", "12h"].map((hours) => (
                    <Button
                      key={hours}
                      type="button"
                      size="sm"
                      onClick={
                        hourHandlerMap[hours as keyof typeof hourHandlerMap]
                      }
                      variant="outline"
                      className={getButtonVariant(hours)}
                    >
                      {hours}
                    </Button>
                  ))}

                  {["7d", "30d", "90d", "today", "all"].map((period) => (
                    <Button
                      key={period}
                      type="button"
                      size="sm"
                      onClick={
                        periodHandlerMap[
                          period as keyof typeof periodHandlerMap
                        ]
                      }
                      variant="outline"
                      className={getButtonVariant(period)}
                    >
                      {getPeriodText(period)}
                    </Button>
                  ))}
                </div>

                <div className="w-full md:ml-auto md:flex md:w-auto md:items-end">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full md:w-auto"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Apply
                  </Button>
                </div>
              </div>

              <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
