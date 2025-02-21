import { useEffect, useRef, useState } from "react";

export const ListContainer = (props: {
  children: React.ReactNode;
  smallesHeight?: number;
  className?: string;
}) => {
  const [isOverflowing, setIsOverflowing] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const maxAllowedHeight =
        window.innerHeight - (props.smallesHeight ?? 280);
      setIsOverflowing(contentHeight > maxAllowedHeight);
      scrollTo({ top: 100, behavior: "smooth" });
    }
  }, [props.smallesHeight]);

  return (
    <div
      ref={contentRef}
      className={`animate-fade-down max-h-[calc(100svh-280px)] overflow-y-auto lg:max-h-[calc(100svh-220px)] ${props.className}`}
    >
      <div
        className={`flex flex-col-reverse gap-4 ${isOverflowing ? "pr-1 md:pr-2" : ""}`}
      >
        {props.children}
      </div>
    </div>
  );
};
