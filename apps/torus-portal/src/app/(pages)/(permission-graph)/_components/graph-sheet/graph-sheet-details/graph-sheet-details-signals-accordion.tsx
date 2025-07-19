import { useMemo } from "react";

import { Calendar, ExternalLink, Percent, Users } from "lucide-react";

import { smallAddress } from "@torus-network/torus-utils/torus/address";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";
import { Badge } from "@torus-ts/ui/components/badge";
import { MarkdownView } from "@torus-ts/ui/components/markdown-view";

import { api } from "~/trpc/react";

import type { CustomGraphNode } from "../../permission-graph-types";

interface SignalsAccordionProps {
  selectedNode?: CustomGraphNode;
}

export function GraphSheetDetailsSignalsAccordion({
  selectedNode,
}: SignalsAccordionProps) {
  const { data: allSignals, isLoading } = api.signal.all.useQuery();

  const nodeSignals = useMemo(() => {
    if (!allSignals || !selectedNode?.id) return [];

    return allSignals.filter((signal) => signal.agentKey === selectedNode.id);
  }, [allSignals, selectedNode?.id]);

  if (isLoading) {
    return (
      <div className="text-gray-500 text-center mt-8">Loading signals...</div>
    );
  }

  if (nodeSignals.length === 0) {
    return (
      <div className="text-gray-500 text-center mt-8">
        No signals found for this agent
      </div>
    );
  }

  const socialLinks = (signal: (typeof nodeSignals)[0]) =>
    [
      { name: "Discord", value: signal.discord, prefix: "" },
      { name: "GitHub", value: signal.github, prefix: "https://github.com/" },
      { name: "Telegram", value: signal.telegram, prefix: "https://t.me/" },
      {
        name: "Twitter",
        value: signal.twitter,
        prefix: "https://x.com/",
      },
    ].filter((social) => social.value);

  return (
    <Accordion type="single" collapsible className="w-full">
      {nodeSignals.map((signal) => (
        <AccordionItem
          key={signal.id}
          value={signal.id.toString()}
          className="border bg-accent mb-2"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-700/50 text-left">
            <div className="flex flex-col gap-1 w-full pr-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {signal.title}
                </span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  {signal.proposedAllocation}%
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                Created {new Date(signal.createdAt).toLocaleDateString()}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
            <div>
              <span className="text-xs text-gray-500">Description</span>
              <div className="text-sm text-gray-300 mt-1 max-w-none overflow-x-auto">
                <MarkdownView
                  source={signal.description}
                  className="prose prose-xs dark:prose-invert max-w-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-500">Agent Key</span>
                <div className="text-sm text-gray-300 font-mono">
                  {smallAddress(signal.agentKey, 8)}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">
                  Proposed Allocation
                </span>
                <div className="text-sm text-gray-300">
                  {signal.proposedAllocation}%
                </div>
              </div>
            </div>

            {socialLinks(signal).length > 0 && (
              <div>
                <span className="text-xs text-gray-500 block mb-2">
                  Contact Information
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {socialLinks(signal).map((social) => (
                    <div
                      key={social.name}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-gray-400">
                        {social.name}
                      </span>
                      {social.prefix ? (
                        <a
                          href={`${social.prefix}${social.value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {social.value}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">
                          {social.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
