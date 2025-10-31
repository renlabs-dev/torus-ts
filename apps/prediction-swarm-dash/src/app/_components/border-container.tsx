import { cn } from "@torus-ts/ui/lib/utils";

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
        "border-border bg-background grid w-full items-center gap-3 border-y",
      )}
    >
      <div className="border-border mx-auto flex w-full max-w-screen-xl border-x">
        {children}
      </div>
    </div>
  );
}
