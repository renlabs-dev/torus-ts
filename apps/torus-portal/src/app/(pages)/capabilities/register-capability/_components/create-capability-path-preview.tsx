export function RegisterCapabilityPathPreview({
  fullPath,
}: {
  fullPath: string;
}) {
  return (
    <div className="border-border bg-muted rounded-md border p-4">
      <p className="mb-2 text-sm font-medium">Full Capability Path:</p>
      <code className="bg-background text-foreground block break-all rounded px-3 py-2 text-sm">
        {fullPath || "Select prefix and enter path..."}
      </code>
    </div>
  );
}
