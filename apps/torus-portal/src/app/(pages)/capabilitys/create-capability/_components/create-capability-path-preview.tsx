export function CreateCapabilityPathPreview({
  fullPath,
}: {
  fullPath: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted p-4">
      <p className="text-sm font-medium mb-2">Full Namespace Path</p>
      <code className="block rounded bg-background px-3 py-2 text-sm text-foreground break-all">
        {fullPath || "Select prefix and enter path..."}
      </code>
      <p className="mt-2 text-xs text-muted-foreground">
        This will be the full path for your capability permission
      </p>
    </div>
  );
}
