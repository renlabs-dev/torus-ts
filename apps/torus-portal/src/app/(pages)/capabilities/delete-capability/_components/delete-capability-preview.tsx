interface DeleteCapabilityPreviewProps {
  selectedPath: { path: string[] };
  watchedSegment: number;
}

export function DeleteCapabilityPreview({
  selectedPath,
  watchedSegment,
}: DeleteCapabilityPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-sm font-medium">Deletion Preview:</div>
        <div className="flex items-center text-sm">
          {watchedSegment >= 2 ? (
            <>
              {watchedSegment > 0 && (
                <>
                  <span className="text-green-600 font-mono">
                    {selectedPath.path.slice(0, watchedSegment).join(".")}
                  </span>
                  <span className="text-muted-foreground">.</span>
                </>
              )}
              <span className="text-red-600 font-mono font-medium">
                {selectedPath.path.slice(watchedSegment).join(".")}
              </span>
            </>
          ) : (
            <span className="text-green-600 font-mono">
              {selectedPath.path.join(".")}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="text-green-600">■</span> Will remain |
          <span className="text-red-600 ml-1">■</span> Will be deleted
        </div>
      </div>
    </div>
  );
}
