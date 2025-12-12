"use client";

import { Button } from "@torus-ts/ui/components/button";
import { Checkbox } from "@torus-ts/ui/components/checkbox";
import { Label } from "@torus-ts/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@torus-ts/ui/components/popover";
import { api } from "~/trpc/react";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

interface TopicSelectProps {
  selectedTopicIds: string[];
  onTopicIdsChange: (topicIds: string[]) => void;
}

export function ContentFilterDialogTopicSelect({
  selectedTopicIds,
  onTopicIdsChange,
}: TopicSelectProps) {
  const [open, setOpen] = React.useState(false);
  const { data: topics, isLoading } = api.topic.getAll.useQuery(undefined, {
    staleTime: Infinity,
  });

  const handleToggle = (topicId: string) => {
    if (selectedTopicIds.includes(topicId)) {
      onTopicIdsChange(selectedTopicIds.filter((id) => id !== topicId));
    } else {
      onTopicIdsChange([...selectedTopicIds, topicId]);
    }
  };

  const getButtonText = () => {
    if (selectedTopicIds.length === 0) return "Select topics";
    if (selectedTopicIds.length === 1) {
      const topic = topics?.find((t) => t.id === selectedTopicIds[0]);
      return topic?.name ?? "1 topic selected";
    }
    return `${selectedTopicIds.length} topics selected`;
  };

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="topics" className="px-1">
        Topics
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="topics"
            className="w-full justify-between font-normal"
          >
            {getButtonText()}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading topics...</p>
            ) : !topics || topics.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No topics available
              </p>
            ) : (
              <>
                {topics.length > 5 && (
                  <div className="flex gap-2 mb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onTopicIdsChange(topics.map(t => t.id))}
                      className="text-xs h-7"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onTopicIdsChange([])}
                      className="text-xs h-7"
                    >
                      Clear All
                    </Button>
                  </div>
                )}
                <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
                  {topics.map((topic) => (
                    <div key={topic.id} className="flex items-center space-x-2 py-1 hover:bg-muted/30 rounded px-1 -mx-1 transition-colors">
                      <Checkbox
                        id={topic.id}
                        checked={selectedTopicIds.includes(topic.id)}
                        onCheckedChange={() => handleToggle(topic.id)}
                      />
                      <label
                        htmlFor={topic.id}
                        className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {topic.name}
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
