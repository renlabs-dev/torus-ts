import { Badge } from "@torus-ts/ui/components/badge";

interface SelectedPathsDisplayProps {
  paths: string[];
}

export function SelectedPathsDisplay({ paths }: SelectedPathsDisplayProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">
        Selected Capability Paths ({paths.length})
      </div>
      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-muted/50 rounded-sm border">
        {paths.map((path) => (
          <Badge key={path} variant="secondary" className="font-mono text-xs">
            {path}
          </Badge>
        ))}
      </div>
    </div>
  );
}