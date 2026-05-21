export function NotEligibleNotice() {
  return (
    <div className="flex flex-col gap-2 py-2 text-sm">
      <p className="font-medium">Not eligible</p>
      <p className="text-muted-foreground">
        This address does not have a migration claim allocation. If you held
        TORUS in a smart contract wallet, contact support for a manual claim.
      </p>
    </div>
  );
}
