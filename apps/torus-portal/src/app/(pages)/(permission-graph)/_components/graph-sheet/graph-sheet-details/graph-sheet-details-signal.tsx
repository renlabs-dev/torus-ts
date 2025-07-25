import { Calendar, Check, Percent, User, Users } from "lucide-react";

import { smallAddress } from "@torus-network/torus-utils/torus/address";

import { Badge } from "@torus-ts/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { MarkdownView } from "@torus-ts/ui/components/markdown-view";

import type { CustomGraphNode } from "../../permission-graph-types";

interface SignalDetailsProps {
  selectedNode: CustomGraphNode;
}

export function GraphSheetDetailsSignal({ selectedNode }: SignalDetailsProps) {
  const signalData = selectedNode.signalData;

  if (!signalData) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No signal data available</p>
        </CardContent>
      </Card>
    );
  }

  const socialLinks = [
    { name: "Discord", value: signalData.discord, prefix: "" },
    { name: "GitHub", value: signalData.github, prefix: "https://github.com/" },
    { name: "Telegram", value: signalData.telegram, prefix: "https://t.me/" },
    {
      name: "Twitter",
      value: signalData.twitter,
      prefix: "https://x.com/",
    },
  ].filter((social) => social.value);

  return (
    <div className="w-full space-y-4 pb-8">
      {/* Main Signal Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {signalData.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {signalData.fulfilled && (
                <Badge className="bg-green-500 text-white gap-1">
                  <Check className="w-3 h-3" />
                  Fulfilled
                </Badge>
              )}
              <Badge variant="secondary" className="flex items-center gap-1">
                <Percent className="w-3 h-3" />
                {signalData.proposedAllocation}
              </Badge>
            </div>
          </div>
          <CardDescription>
            Demand Signal from {smallAddress(signalData.agentKey)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <div className="text-sm text-muted-foreground max-w-none overflow-x-auto">
              <MarkdownView
                source={signalData.description}
                className="prose prose-sm dark:prose-invert max-w-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Created {new Date(signalData.createdAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      {/* Agent Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Requesting Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-sm">
                {smallAddress(signalData.agentKey)}
              </p>
              <p className="text-xs text-muted-foreground">
                Agent requesting this capability
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      {socialLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {socialLinks.map((social) => (
                <div
                  key={social.name}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{social.name}</span>
                  {social.prefix ? (
                    <a
                      href={`${social.prefix}${social.value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {social.value}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {social.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
