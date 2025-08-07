import { Badge } from "@torus-ts/ui/components/badge";

interface StatsPanelProps {
  selectedCount: number;
  accessibleCount: number;
  viewOnlyCount: number;
}

export function StatsPanel({
  selectedCount,
  accessibleCount,
  viewOnlyCount,
}: StatsPanelProps) {
  return (
    <div className="flex space-x-2">
      <Badge variant="default">
        {selectedCount} of {accessibleCount} selected
      </Badge>
      <Badge variant="secondary">{viewOnlyCount} view-only</Badge>
    </div>
  );
}