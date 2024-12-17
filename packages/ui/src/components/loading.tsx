import { LoaderCircle } from "lucide-react";

import { cn } from "..";

export function Loading(props: {
  className?: string;
  size?: number | string;
}): JSX.Element {
  const { className, size } = props;
  return (
    <div className={cn("mr-1 grid place-content-center")} role="status">
      <LoaderCircle size={size} className={cn(className, "animate-spin")} />
      <span className={cn("sr-only")}>Loading...</span>
    </div>
  );
}
