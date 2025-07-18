export function CreateCapabilityPathPreview({
  fullPath,
}: {
  fullPath: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted p-4">
      <p className="text-sm font-medium mb-2">Full Capability Path:</p>
      <code className="block rounded bg-background px-3 py-2 text-sm text-foreground break-all">
        {fullPath || "Select prefix and enter path..."}
      </code>
    </div>
  );
}
