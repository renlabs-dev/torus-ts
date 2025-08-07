import { Button } from "@torus-ts/ui/components/button";

interface ActionButtonsPanelProps {
  selectedCount: number;
  onClearSelection: () => void;
  onCreatePermission: () => void;
}

export function ActionButtonsPanel({
  selectedCount,
  onClearSelection,
  onCreatePermission,
}: ActionButtonsPanelProps) {
  const hasSelection = selectedCount > 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={onClearSelection}
        disabled={!hasSelection}
      >
        Clear Selection
      </Button>
      <Button size="sm" disabled={!hasSelection} onClick={onCreatePermission}>
        Create Permission ({selectedCount} paths)
      </Button>
    </>
  );
}
