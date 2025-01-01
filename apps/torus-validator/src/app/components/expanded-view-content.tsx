"use client";

import { useEffect, useRef, useState } from "react";
import { MoveDown } from "lucide-react";

import { Button } from "@torus-ts/ui";
import { MarkdownView } from "@torus-ts/ui/markdown-view";
import { removeEmojisLmao } from "@torus-ts/utils";

interface ExpandedViewContentProps {
  content: string | null;
}

export const ExpandedViewContent = (
  props: ExpandedViewContentProps,
): JSX.Element => {
  const { content } = props;
  const contentRef = useRef<HTMLDivElement>(null);
  const [expandedText, setExpandedText] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const handleExpandedText = () => {
    if (expandedText) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
    setExpandedText(!expandedText);
  };

  useEffect(() => {
    // Check if the content is overflowing to decide whether to show the expand/collapse button
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const maxAllowedHeight = 250;
      setIsOverflowing(contentHeight > maxAllowedHeight);
    }
  }, [content]);

  return (
    <div
      className={`flex h-fit w-full animate-fade-down flex-col animate-delay-100`}
    >
      <div
        ref={contentRef}
        className={`relative block overflow-hidden ${expandedText ? "max-h-full pb-12" : "max-h-[250px] pb-0"} duration-1000`}
      >
        <MarkdownView
          source={removeEmojisLmao(content ?? "Content not found.")}
        />

        {isOverflowing && (
          <div
            className={`absolute bottom-0 flex w-full items-end justify-center ${expandedText ? "h-9 animate-accordion-up bg-transparent" : "h-24 animate-accordion-down bg-gradient-to-b from-transparent to-background"} `}
          >
            <Button
              className="flex w-32 items-center gap-2"
              onClick={() => handleExpandedText()}
              variant="outline"
              aria-expanded={expandedText}
            >
              {expandedText ? "Collapse" : "Expand"}
              <MoveDown
                size={16}
                className={`${expandedText ? "rotate-180" : "rotate-0"} transition-transform duration-500`}
              />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
