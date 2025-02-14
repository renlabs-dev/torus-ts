"use client";

import { cn } from ".";
import MarkdownPreview from "@uiw/react-markdown-preview";

interface MarkdownViewProps {
  className?: string;
  source: string;
}
export function MarkdownView(props: MarkdownViewProps): JSX.Element {
  const { source, className } = props;
  return (
    <MarkdownPreview
      className={cn(`${className}`)}
      source={source}
      style={{ backgroundColor: "transparent", color: "white" }}
    />
  );
}
