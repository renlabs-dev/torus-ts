import { useEffect, useRef, useState } from "react";

export const ListContainer = (props: { children: React.ReactNode }) => {
  const [isOverflowing, setIsOverflowing] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const maxAllowedHeight = window.innerHeight - 280;
      setIsOverflowing(contentHeight > maxAllowedHeight);
      scrollTo({ top: 100, behavior: "smooth" });
    }
  }, []);

  return (
    <div
      ref={contentRef}
      className={`max-h-[calc(100svh-280px)] animate-fade-down overflow-y-auto lg:max-h-[calc(100svh-220px)]`}
    >
      <div
        className={`flex flex-col-reverse gap-4 ${isOverflowing ? "pr-1 md:pr-2" : ""}`}
      >
        {props.children}
      </div>
    </div>
  );
};
