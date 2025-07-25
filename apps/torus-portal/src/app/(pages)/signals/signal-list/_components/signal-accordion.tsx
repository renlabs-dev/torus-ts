"use client";

import { Check, Radio, Trash2 } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { MarkdownView } from "@torus-ts/ui/components/markdown-view";

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
          <Badge className="bg-green-500 text-white gap-1 mr-2">
            <Check className="w-3 h-3" />
            Fulfilled
          </Badge>
        );
      case "deleted":
        return (
          <Badge className="bg-red-500 text-white gap-1 mr-2">
            <Trash2 className="w-3 h-3" />
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
            <div className="flex items-center gap-2 text-left w-full">
              <Badge>#{index + 1}</Badge>

              <div>
                <h3 className="font-medium">{signal.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {signal.agentName}
                </p>
              </div>
            </div>
            <div className="flex">
              {renderStatusBadge()}
              {signal.isCurrentUser && (
                <Badge className="text-nowrap mr-2 sm:block hidden">
                  Your Signal
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="flex md:flex-row flex-col gap-2 items-center justify-between">
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Agent Weight
                    </p>
                    <p className="text-xl font-semibold">
                      {signal.agentPercWeight.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Proposed Allocation
                    </p>
                    <p className="text-xl font-semibold">
                      {signal.proposedAllocation}%
                    </p>
                  </div>
                </div>
                {signal.isCurrentUser && variant === "active" && (
                  <div className="flex gap-2">
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
                        <Radio className="w-4 h-4" />
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
                        <Trash2 className="w-4 h-4" />
                        {isDeletingSignal ? "Deleting..." : "Delete"}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {signal.description && (
                <div className="pt-4 bg-muted/50 rounded-md p-4 border">
                  <MarkdownView source={signal.description} />
                </div>
              )}

              {(signal.discord ??
                signal.github ??
                signal.telegram ??
                signal.twitter) && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Contact</p>
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
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
