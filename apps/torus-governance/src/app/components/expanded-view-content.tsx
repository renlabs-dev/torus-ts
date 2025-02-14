import { Button } from "@torus-ts/ui";
import { MarkdownView } from "@torus-ts/ui/markdown-view";
import { removeEmojisLmao } from "@torus-ts/utils";
import { MoveDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
    <div className={`flex h-fit w-full animate-fade-down flex-col`}>
      <h2 className="break-words pb-5 text-2xl font-bold text-white">
        {title ?? "Title not found"}
      </h2>
      <div
        ref={contentRef}
        className={`relative block overflow-hidden ${expandedText ? "max-h-full pb-24" : "max-h-[250px] pb-0"} duration-1000`}
      >
        <MarkdownView source={removeEmojisLmao(body ?? "Content not found.")} />

        {isOverflowing && (
          <div
            className={`absolute -bottom-0 flex w-full items-end justify-center ${expandedText ? "h-0 animate-fade" : "h-12 animate-fade"} bg-gradient-to-b from-transparent to-black transition-all duration-100`}
          >
            <Button
              className="flex w-32 items-center gap-2 bg-black"
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
