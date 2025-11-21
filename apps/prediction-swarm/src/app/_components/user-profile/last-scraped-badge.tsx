import { Badge } from "@torus-ts/ui/components/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Clock } from "lucide-react";

dayjs.extend(relativeTime);

interface LastScrapedBadgeProps {
  scrapedAt: Date | null;
}

export function LastScrapedBadge({ scrapedAt }: LastScrapedBadgeProps) {
  if (!scrapedAt) {
    return null;
  }

  const lastScraped = dayjs(scrapedAt);
  const nextScrape = lastScraped.add(1, "day");
  const now = dayjs();
  const isScheduledForUpdate = now.isAfter(nextScrape);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={"outline"} className="gap-1.5 rounded-full py-1">
            <Clock className="h-3 w-3" />
            Scraped {lastScraped.fromNow()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-background/90 text-muted-foreground max-w-xs">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Last scraped:</strong>{" "}
              {lastScraped.format("MMM D, YYYY [at] h:mm A")}
            </p>
            <p>
              <strong>Re-scrape logic:</strong> If this user is not currently
              being scraped (not in the job queue) and it has been more than 24
              hours since the last scrape, they will be automatically updated.
            </p>
            <p>
              <strong>Next eligible scrape:</strong>{" "}
              {nextScrape.format("MMM D, YYYY [at] h:mm A")}
              {isScheduledForUpdate && (
                <span className="text-primary ml-1 font-semibold">
                  (eligible now)
                </span>
              )}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
