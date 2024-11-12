import { useEffect, useRef, useState } from "react";
import { MoveDown } from "lucide-react";

import { Button } from "@torus-ts/ui";
import { MarkdownView } from "@torus-ts/ui/markdown-view";
import { removeEmojis } from "@torus-ts/utils";

interface ExpandedViewContentProps {
  title: string | null;
  body: string | null;
}

export const ExpandedViewContent = (
  props: ExpandedViewContentProps,
): JSX.Element => {
  const { body, title } = props;
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
  }, [body]);

  return (
    <div
      className={`flex h-fit animate-fade-down flex-col transition-all animate-delay-100`}
    >
      <h2 className="break-words pb-5 text-2xl font-bold text-white">
        {title ?? "Title not found"}
      </h2>
      <div
        ref={contentRef}
        className={`relative block lg:overflow-hidden ${expandedText ? "max-h-full pb-12" : "max-h-[250px] pb-0"} transition-all duration-1000`}
      >
        <MarkdownView source={removeEmojis(body ?? "Content not found.")} />

        {isOverflowing && (
          <div
            className={`absolute bottom-0 flex h-24 w-full items-end justify-center ${expandedText ? "animate-accordion-up bg-transparent" : "animate-accordion-down bg-gradient-to-b from-[#04061C1A] to-[#04061C]"}`}
          >
            <Button
              className="flex w-32 items-center gap-2 rounded-md"
              onClick={() => handleExpandedText()}
              variant="default"
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
