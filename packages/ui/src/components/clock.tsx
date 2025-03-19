"use client";

import { Clock as ClockIcon } from "lucide-react";
import React, { useState, useEffect, useCallback, useMemo } from "react";

export default function Clock() {
  const [date, setDate] = useState(new Date());

  const tick = useCallback(() => {
    setDate(new Date());
  }, []);

  useEffect(() => {
    const timerID = setInterval(() => tick(), 1000);
    return () => clearInterval(timerID);
  }, [tick]);

  const options = useMemo(
    () => ({
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    [],
  );

  const dateTimeString = useMemo(
    () => date.toLocaleString("en-GB", options as Intl.DateTimeFormatOptions),
    [date, options],
  );

  return (
    <span className="flex items-center gap-1.5">
      <ClockIcon className="h-3 w-3 text-white" />
      {dateTimeString}
    </span>
  );
}
