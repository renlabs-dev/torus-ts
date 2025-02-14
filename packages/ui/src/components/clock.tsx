"use client";

import { Clock as ClockIcon } from "lucide-react";
import React, { useCallback, useEffect, useMemo,useState } from "react";

export default function Clock() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timerID = setInterval(() => tick(), 1000);
    return () => clearInterval(timerID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tick = useCallback(() => {
    setDate(new Date());
  }, []);

  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  const dateTimeString = useMemo(
    () => date.toLocaleString("en-GB", options as Intl.DateTimeFormatOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [date],
  );

  return (
    <span className="flex items-center gap-1.5">
      <ClockIcon className="h-3 w-3 text-white" />
      {dateTimeString}
    </span>
  );
}
