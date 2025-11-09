import { Brain, Clock, Download, ShieldCheck } from "lucide-react";

type ScraperStatus = "suggested" | "scraping" | "processing" | "complete";

interface ProgressStagesProps {
  status: ScraperStatus;
}

export function ProgressStages({ status }: ProgressStagesProps) {
  const stages = [
    {
      id: "suggested",
      label: "Suggested",
      icon: Clock,
      active: status === "suggested",
      complete: ["scraping", "processing", "complete"].includes(status),
    },
    {
      id: "scraping",
      label: "Scraping",
      icon: Download,
      active: status === "scraping",
      complete: ["processing", "complete"].includes(status),
    },
    {
      id: "processing",
      label: "Processing",
      icon: Brain,
      active: status === "processing",
      complete: status === "complete",
    },
    {
      id: "complete",
      label: "Complete",
      icon: ShieldCheck,
      active: status === "complete",
      complete: status === "complete",
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {stages.map((stage, idx) => {
        const Icon = stage.icon;
        return (
          <div key={stage.id} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
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
            {idx < stages.length - 1 && (
              <div
                className={`h-0.5 w-8 ${
                  stage.complete ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
