import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { cn } from "@torus-ts/ui/lib/utils";

interface CardSkeletonProps {
  variant?: "default" | "small";
}

export function CardSkeleton({ variant }: CardSkeletonProps) {
  return (
    <Card
      className={cn(
        "animate-fade transition duration-500",
        variant === "small" ? "py-1 border-none border-b" : "p-4 lg:p-6",
      )}
    >
      <CardHeader
        className={cn(
          `flex flex-col-reverse items-start justify-between space-y-0 px-0 pt-0
          md:flex-col-reverse xl:flex-row`,
          variant === "small" ? "pb-0" : "pb-5",
        )}
      >
        <div className="flex w-fit flex-col items-start gap-2 sm:flex-row">
          <Skeleton
            className={cn(
              "py-2.5",
              variant === "small" ? "min-w-32" : "min-w-40",
            )}
          />
          {variant !== "small" && <Skeleton className="min-w-36 py-2.5" />}
        </div>
        <div
          className={cn(
            "flex flex-row gap-2 pt-0",
            variant === "small" ? "pb-2" : "pb-4",
          )}
        >
          <Skeleton
            className={cn(
              "!rounded-full py-3",
              variant === "small" ? "min-w-24" : "min-w-32",
            )}
          />
          {variant !== "small" && (
            <Skeleton className="min-w-20 !rounded-full py-3" />
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-0 py-0">
        <Skeleton
          className={cn("w-full", variant === "small" ? "py-2" : "py-3")}
        />
        {variant !== "small" && <Skeleton className="min-w-48 py-3" />}
      </CardContent>
    </Card>
  );
}
