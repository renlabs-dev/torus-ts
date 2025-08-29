"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { MarkdownView } from "@torus-ts/ui/components/markdown-view";
import { useMultipleAccountEmissions } from "~/hooks/use-multiple-account-emissions";
import { calculateStreamValue } from "~/utils/calculate-stream-value";
import { Check, Radio, Trash2 } from "lucide-react";

interface SignalWithMetadata {
  id: number;
  title: string;
  description: string | null;
  proposedAllocation: number;
  agentKey: string;
  fulfilled: boolean;
  deletedAt: Date | null;
  discord: string | null;
  github: string | null;
  telegram: string | null;
  twitter: string | null;
  agentName: string;
  agentPercWeight: number;
  networkAllocation: number;
  isCurrentUser: boolean;
}

interface SignalAccordionProps {
  signals: SignalWithMetadata[];
  onDelete?: (signalId: number) => void;
  onFulfill?: (signalId: number) => void;
  isDeletingSignal?: boolean;
  isFulfillingSignal?: boolean;
  variant?: "active" | "fulfilled" | "deleted";
}

export default function SignalAccordion({
  signals,
  onDelete,
  onFulfill,
  isDeletingSignal = false,
  isFulfillingSignal = false,
  variant = "active",
}: SignalAccordionProps) {
  // Get unique agent keys from signals for batch emission query
  const uniqueAgentKeys = [
    ...new Set(signals.map((signal) => signal.agentKey)),
  ];

  const emissionsData = useMultipleAccountEmissions({
    accountIds: uniqueAgentKeys,
  });
  const getItemClassName = () => {
    switch (variant) {
      case "fulfilled":
        return "px-4 bg-green-500/5 border-green-500 border-b";
      case "deleted":
        return "px-4 bg-red-500/5 border-red-500 border-b";
      default:
        return "px-4 bg-muted/50";
    }
  };

  const renderStatusBadge = () => {
    switch (variant) {
      case "fulfilled":
        return (
          <Badge className="mr-2 gap-1 bg-green-500 text-white">
            <Check className="h-3 w-3" />
            Fulfilled
          </Badge>
        );
      case "deleted":
        return (
          <Badge className="mr-2 gap-1 bg-red-500 text-white">
            <Trash2 className="h-3 w-3" />
            Deleted
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Accordion type="single" collapsible className="mt-6 space-y-4">
      {signals.map((signal, index) => (
        <AccordionItem
          key={signal.id || index}
          value={`signal-${index}`}
          className={getItemClassName()}
        >
          <AccordionTrigger className="flex items-center justify-between">
            <div className="flex w-full items-center gap-2 text-left">
              <Badge>#{index + 1}</Badge>

              <div>
                <h3 className="font-medium">{signal.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {signal.agentName}
                </p>
              </div>
            </div>
            <div className="flex">
              {renderStatusBadge()}
              {signal.isCurrentUser && (
                <Badge className="mr-2 hidden text-nowrap sm:block">
                  Your Signal
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Agent Weight
                    </p>
                    <p className="text-xl font-semibold">
                      {signal.agentPercWeight.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Proposed Allocation
                    </p>
                    <p className="text-xl font-semibold">
                      {signal.proposedAllocation}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Stream Value
                    </p>
                    <p className="text-lg font-semibold text-green-400">
                      {calculateStreamValue(
                        signal.proposedAllocation,
                        emissionsData[signal.agentKey],
                        true, // Always true for signal list display
                        signal.agentKey,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {signal.description && (
                <div className="bg-muted/50 rounded-md border p-4 pt-4">
                  <MarkdownView source={signal.description} />
                </div>
              )}

              {(signal.discord ??
                signal.github ??
                signal.telegram ??
                signal.twitter) && (
                <div className="border-t pt-4">
                  <p className="text-muted-foreground mb-2 text-sm">Contact</p>
                  <div className="flex flex-wrap gap-2">
                    {signal.discord && (
                      <Badge variant="secondary" className="text-xs">
                        Discord: {signal.discord}
                      </Badge>
                    )}
                    {signal.github && (
                      <Badge variant="secondary" className="text-xs">
                        GitHub: {signal.github}
                      </Badge>
                    )}
                    {signal.telegram && (
                      <Badge variant="secondary" className="text-xs">
                        Telegram: {signal.telegram}
                      </Badge>
                    )}
                    {signal.twitter && (
                      <Badge variant="secondary" className="text-xs">
                        Twitter: {signal.twitter}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {signal.isCurrentUser && variant === "active" && (
                <div className="border-border flex w-full justify-end gap-2 border-t pt-2">
                  {onFulfill && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFulfill(signal.id);
                      }}
                      disabled={isFulfillingSignal}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Radio className="h-4 w-4" />
                      {isFulfillingSignal ? "Fulfilling..." : "Fulfill"}
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(signal.id);
                      }}
                      disabled={isDeletingSignal}
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeletingSignal ? "Deleting..." : "Delete"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
