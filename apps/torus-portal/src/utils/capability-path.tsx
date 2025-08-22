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

/**
 * Safely extracts capability paths from various data formats.
 * Handles arrays, strings, Maps, objects, and other complex structures.
 *
 * @param namespacePaths - The namespace paths data (can be various formats)
 * @returns Object containing paths array and concatenated path string
 *
 * @example
 * ```ts
 * getCapabilityPaths(["agent.path1", "agent.path2"])
 * // Returns: { paths: ["agent.path1", "agent.path2"], pathString: "agent.path1 agent.path2" }
 *
 * getCapabilityPaths("agent.single.path")
 * // Returns: { paths: ["agent.single.path"], pathString: "agent.single.path" }
 * ```
 */
export function getCapabilityPaths(namespacePaths: unknown): {
  paths: string[];
  pathString: string;
} {
  const extractPaths = (data: unknown): string[] => {
    if (Array.isArray(data)) return data.map(String);
    if (typeof data === "string") {
      return data.includes(",") ? data.split(",").map((s) => s.trim()) : [data];
    }

    if (data && typeof data === "object") {
      try {
        if (data instanceof Map) {
          const paths: string[] = [];
          for (const value of data.values()) {
            if (Array.isArray(value)) {
              paths.push(
                ...value.map((item) =>
                  Array.isArray(item) ? item.join(".") : String(item),
                ),
              );
            } else {
              paths.push(String(value));
            }
          }
          return paths.filter(Boolean);
        }

        if ("values" in data && typeof data.values === "function") {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          const values = Array.from(data.values() as Iterable<unknown>);
          return values
            .flatMap((v) => (Array.isArray(v) ? v.map(String) : [String(v)]))
            .filter(Boolean);
        }

        const keys = Object.keys(data).sort((a, b) => {
          const [numA, numB] = [parseInt(a, 10), parseInt(b, 10)];
          return !isNaN(numA) && !isNaN(numB)
            ? numA - numB
            : a.localeCompare(b);
        });

        return keys
          .map((key) => String((data as Record<string, unknown>)[key]))
          .filter(Boolean);
      } catch {
        return [];
      }
    }

    return [];
  };

  const paths = extractPaths(namespacePaths);
  // Use space to preserve token boundaries for search use-cases.
  return { paths, pathString: paths.join(" ") };
}

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
