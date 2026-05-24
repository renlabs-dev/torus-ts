import { CheckCircle } from "lucide-react";

export function AlreadyClaimedNotice({ amount }: Readonly<{ amount: string }>) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-sm">
      <CheckCircle className="h-8 w-8 text-green-500" />
      <p className="font-medium">Tokens already claimed</p>
      <p className="text-muted-foreground">
        {amount} TORUS was claimed for this address.
      </p>
    </div>
  );
}
