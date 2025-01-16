"use client";

import { Clock as ClockIcon } from "lucide-react";
import React, {
  useState,
  useEffect,
  Suspense,
  useCallback,
  useMemo,
} from "react";

export function Clock() {
  const [date, setDate] = useState(new Date());
  useEffect(() => {
    const timerID = setInterval(() => tick(), 1000);
    return () => clearInterval(timerID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tick = useCallback(() => {
    setDate(new Date());
  }, []);

  const options = { hour: "2-digit", minute: "2-digit", hour12: false };
  const timeString = useMemo(
    () =>
      date.toLocaleTimeString("en-GB", options as Intl.DateTimeFormatOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [date],
  );

  return (
    <span className="flex items-center gap-1.5">
      <ClockIcon className="h-3 w-3 text-white" />
      <Suspense fallback={<div>Loading...</div>}>{timeString}</Suspense>
    </span>
  );
}
