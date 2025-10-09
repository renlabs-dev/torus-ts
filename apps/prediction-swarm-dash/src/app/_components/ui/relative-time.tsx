"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

dayjs.extend(relativeTime);

interface RelativeTimeProps {
  date: string | Date;
  className?: string;
  showTooltip?: boolean;
}

export function RelativeTime({
  date,
  className = "",
  showTooltip = true,
}: RelativeTimeProps) {
  const dayjsDate = dayjs(date);
  const relativeTimeString = dayjsDate.fromNow();
  const fullDateString = dayjsDate.format("MMMM D, YYYY [at] h:mm A");

  if (!showTooltip) {
    return <span className={className}>{relativeTimeString}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`cursor-help ${className}`}>
            {relativeTimeString}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{fullDateString}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
