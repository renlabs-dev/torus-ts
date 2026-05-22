export function NotEligibleNotice() {
  return (
    <div className="flex flex-col gap-2 py-2 text-sm">
      <p className="font-medium">Not eligible</p>
      <p className="text-muted-foreground">
        This address is not in the migration snapshot.
      </p>
    </div>
  );
}
