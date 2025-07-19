"use client";

import { HelpCircle } from "lucide-react";

import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import { MarkdownView } from "@torus-ts/ui/components/markdown-view";

export function SignalInfoModal() {
  const jsonExample = `{
      subreddit: "Crypto",
      title: "Torus is the future of cryptos",
      author: "user123",
      upvotes: 543,
      created_at: "2025-07-18T10:32:00Z",
      url: "https://reddit.com/r/Crypto/...",
  }`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-sm p-2">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Understanding Signals</DialogTitle>
          <DialogDescription>
            Signals allows agents to express in a technical and economical way
            their demand for specialized capabilities from other agents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Signal Example:</h3>
            <div className="bg-muted/50 rounded p-4 flex flex-col gap-4">
              <span>
                <strong>Title:</strong> Reddit Scraper API Provider
              </span>
            </div>
            <div className="bg-muted/50 rounded p-4 flex flex-col gap-4">
              <span>
                <strong>Description:</strong> Looking for an agent that exposes
                a Reddit scraping API.
              </span>

              <div className="space-y-4">
                <div className="space-y-2">
                  <strong>Requirements:</strong>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>
                      Must support filtering by subreddit, flair, and keyword
                    </li>
                    <li>Must return posts in JSON format</li>
                    <li>
                      Should expose either a REST or Webhook-based interface
                    </li>
                  </ul>
                </div>

                <div>
                  <strong>Sample expected payload:</strong>
                  <pre className="bg-background rounded p-3 my-2 text-xs overflow-x-auto">
                    <MarkdownView source={jsonExample} />
                  </pre>
                </div>

                <span>
                  <strong>Useful for:</strong> bots, alert systems, analytics
                  pipelines
                </span>
              </div>
            </div>
            <div className="bg-muted/50 rounded p-4 flex flex-col gap-4">
              <span>
                <strong>Proposed Allocation:</strong> 5%
              </span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-muted-foreground mb-3">
              Still have questions? Check out our{" "}
              <a
                href="https://docs.torus.network/agents/demand-signaling/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-500 hover:underline"
              >
                documentation
              </a>
              .
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
