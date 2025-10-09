import { cn } from "@/lib/utils";

export function BorderContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        className,
        "grid items-center gap-3 w-full border-y border-border bg-background"
      )}
    >
      <div className="flex w-full max-w-screen-xl mx-auto border-x border-border">
        {children}
      </div>
    </div>
  );
}
