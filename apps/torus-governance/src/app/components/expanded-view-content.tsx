import { Button } from "@torus-ts/ui";
import { MarkdownView } from "@torus-ts/ui/markdown-view";
import { removeEmojis } from "@torus-ts/utils";
import { MoveDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ExpandedViewContentProps {
  title: string | null;
  body: string | null;
}

export const ExpandedViewContent = (props: ExpandedViewContentProps): JSX.Element => {
  const { body, title } = props;
  const contentRef = useRef<HTMLDivElement>(null);
  const [expandedText, setExpandedText] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false);

  const handleExpandedText = () => {
    if (expandedText) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
    setExpandedText(!expandedText);
  }

  useEffect(() => {
    // Check if the content is overflowing to decide whether to show the expand/collapse button
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const maxAllowedHeight = 250;
      setIsOverflowing(contentHeight > maxAllowedHeight);
    }
  }, [body]);

  return (
    <div className={`flex h-fit animate-fade-down flex-col animate-delay-100 transition-all`}>
      <h2 className="pb-5 text-2xl font-bold text-white break-words">
        {title ?? "Title not found"}
      </h2>
      <div
        ref={contentRef}
        className={`relative lg:overflow-hidden ${expandedText ? "pb-12 max-h-full" : 'pb-0  max-h-[250px]'} duration-1000 transition-all`}>
        <MarkdownView source={removeEmojis(body ?? "Content not found.")} />

        {isOverflowing && (
          <div className={`absolute bottom-0 flex items-end justify-center w-full h-24 ${expandedText ? "bg-transparent animate-accordion-up" : "bg-gradient-to-b from-[#04061C1A] to-[#04061C] animate-accordion-down"}`}>
            <Button
              className="flex items-center gap-2 rounded-md w-32"
              onClick={() => handleExpandedText()}
              variant="default"
              aria-expanded={expandedText}
            >
              {expandedText ? "Collapse" : "Expand"}
              <MoveDown size={16} className={`${expandedText ? "rotate-180" : "rotate-0"} duration-500 transition-transform`} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}