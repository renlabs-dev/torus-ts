import { cn } from "..";
import { LoaderCircle } from "lucide-react";

export function Loading(
  props: Readonly<{
    className?: string;
    size?: number | string;
  }>,
): JSX.Element {
  const { className, size } = props;
  return (
    <output className={cn("mr-1 grid place-content-center")}>
      <LoaderCircle size={size} className={cn(className, "animate-spin")} />
      <span className={cn("sr-only")}>Loading...</span>
    </output>
  );
}
