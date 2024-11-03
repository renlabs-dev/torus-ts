"use client";

import MarkdownPreview from "@uiw/react-markdown-preview";

interface MarkdownViewProps {
  className?: string;
  source: string;
}
export function MarkdownView(props: MarkdownViewProps): JSX.Element {
  const { source, className } = props;
  return (
    <MarkdownPreview
      className={`${className}`}
      source={source}
      style={{ backgroundColor: "transparent", color: "white" }}
    />
  );
}
