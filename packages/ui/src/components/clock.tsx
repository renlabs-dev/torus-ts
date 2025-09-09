"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Clock as ClockIcon } from "lucide-react";

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

export default function Clock() {
  const [date, setDate] = useState(new Date());

  const tick = useCallback(() => {
    setDate(new Date());
  }, []);

  useEffect(() => {
    const timerID = setInterval(() => tick(), 1000);
    return () => clearInterval(timerID);
  }, [tick]);

  const dateTimeString = useMemo(
    () => date.toLocaleString("en-GB", DATE_FORMAT_OPTIONS),
    [date],
  );

  return (
    <span className="flex items-center gap-1.5">
      <ClockIcon className="h-3 w-3 text-white" />
      <Suspense
        fallback={
          <span className="animate-pulse">Day, 00 Mon 0000, 00:00</span>
        }
      >
        {dateTimeString}
      </Suspense>
    </span>
  );
}
