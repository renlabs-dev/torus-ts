import { Badge } from "@torus-ts/ui/components/badge";

interface SelectedPathsDisplayProps {
  paths: string[];
}

export function SelectedPathsDisplay({ paths }: SelectedPathsDisplayProps) {
  // Transform full path to display format (parent.current, without agent. prefix)
  const getDisplayPath = (fullPath: string): string => {
    const withoutAgentPrefix = fullPath.startsWith("agent.")
      ? fullPath.substring(6)
      : fullPath;

    if (!withoutAgentPrefix) return fullPath;

    const segments = withoutAgentPrefix.split(".");
    if (segments.length <= 1) return withoutAgentPrefix;

    return segments.slice(-2).join(".");
  };
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">
        Selected Capability Paths ({paths.length})
      </div>
      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-muted/50 rounded-sm border">
        {paths.map((path) => (
          <Badge
            key={path}
            variant="secondary"
            className="font-mono text-xs"
            title={path} // Show full path on hover
          >
            {getDisplayPath(path)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
