import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { Clock, Download, RefreshCw, ShieldCheck } from "lucide-react";

interface ProgressStagesProps {
  status: string;
}

export function ProgressStages({ status }: ProgressStagesProps) {
  const stages = [
    {
      id: "suggested",
      label: "Suggested",
      icon: Clock,
      tooltip:
        "Account has been added to the queue and is waiting to be processed",
      active: status === "suggested",
      complete: ["scraping", "complete", "updating"].includes(status),
    },
    {
      id: "scraping",
      label: "Scraping",
      icon: Download,
      tooltip: "Actively downloading tweets from this account's timeline",
      active: status === "scraping",
      complete: ["complete", "updating"].includes(status),
    },
    {
      id: "complete",
      label: "Complete",
      icon: ShieldCheck,
      tooltip:
        "All predictions generated and verified. Account is ready to view",
      active: status === "complete",
      complete: ["complete", "updating"].includes(status),
    },
    {
      id: "updating",
      label: "Updating",
      icon: RefreshCw,
      tooltip:
        "Account was already scraped and is being updated with new tweets (last scraping was more than one day ago)",
      active: status === "updating",
      complete: status === "updating",
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div key={stage.id} className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-8 w-8 cursor-help items-center justify-center rounded-full border-2 ${
                        stage.complete
                          ? "bg-primary border-primary"
                          : stage.active
                            ? "border-primary bg-primary/10 animate-pulse"
                            : "border-muted-foreground/30 bg-muted/30"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          stage.complete
                            ? "text-primary-foreground"
                            : stage.active
                              ? "text-primary"
                              : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-xs font-medium ${
                          stage.complete || stage.active
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {stage.label}
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">{stage.tooltip}</p>
                </TooltipContent>
              </Tooltip>
              {idx < stages.length - 1 && (
                <div
                  className={`mb-5 h-0.5 w-8 ${
                    stage.complete ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
