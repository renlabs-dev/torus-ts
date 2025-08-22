import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";

/**
 * Transforms a capability namespace path to a more readable format.
 * For long paths (>3 segments), shows first.second.[…].last format.
 * For short paths (≤3 segments), shows the full path.
 *
 * @param path - The full namespace path (e.g., "agent.prediction-swarm-memory.very.long.nested.path.leaf")
 * @returns Formatted path (e.g., "agent.prediction-swarm-memory.[…].leaf")
 *
 * @example
 * ```ts
 * formatCapabilityPath("agent.prediction-swarm-memory.very.long.nested.path.leaf")
 * // Returns: "agent.prediction-swarm-memory.[…].leaf"
 *
 * formatCapabilityPath("agent.simple.path")
 * // Returns: "agent.simple.path"
 * ```
 */
export const formatCapabilityPath = (path: string): string => {
  const parts = path.split(".");
  if (parts.length <= 3) {
    return path; // Show full path if short
  }
  const first = parts[0];
  const second = parts[1];
  const last = parts[parts.length - 1];
  return `${first}.${second}.[…].${last}`;
};

interface CapabilityPathProps {
  path: string;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Component that displays a formatted capability path with optional tooltip.
 * Always shows the shortened format, with optional tooltip showing the full path on hover.
 *
 * @param path - The full namespace path
 * @param className - Optional CSS classes to apply
 * @param showTooltip - Whether to show tooltip with full path on hover (default: true)
 */
export function ShortenedCapabilityPath({
  path,
  className = "",
  showTooltip = true,
}: CapabilityPathProps) {
  const formattedPath = formatCapabilityPath(path);
  const isShortened = path.split(".").length > 3;

  if (!showTooltip || !isShortened) {
    return <span className={className}>{formattedPath}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`cursor-help ${className}`}>{formattedPath}</span>
        </TooltipTrigger>
        <TooltipContent className="z-[100]">
          <p className="font-mono text-xs max-w-md break-all">{path}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
