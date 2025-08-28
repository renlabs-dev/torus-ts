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
        <div className="flex flex-col text-sm sm:flex-row md:items-center">
          {watchedSegment >= 2 ? (
            <>
              {watchedSegment > 0 && (
                <>
                  <span className="font-mono text-green-600">
                    {selectedPath.path.slice(0, watchedSegment).join(".")}
                  </span>
                  <span className="text-muted-foreground">.</span>
                </>
              )}
              <span className="font-mono font-medium text-red-600">
                {selectedPath.path.slice(watchedSegment).join(".")}
              </span>
            </>
          ) : (
            <span className="font-mono text-green-600">
              {selectedPath.path.join(".")}
            </span>
          )}
        </div>
        <div className="text-muted-foreground text-xs">
          <span className="text-green-600">■</span> Will remain |
          <span className="ml-1 text-red-600">■</span> Will be deleted
        </div>
      </div>
    </div>
  );
}
