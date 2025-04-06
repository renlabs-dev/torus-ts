import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import { Skeleton } from "@torus-ts/ui/components/skeleton";

export function CardSkeleton() {
  return (
    <Card className="p-6">
      <CardHeader className="flex flex-col-reverse items-start justify-between space-y-0 px-0 pb-5 pt-0 xl:flex-row">
        <div className="flex w-fit flex-col items-start gap-2 sm:flex-row">
          <Skeleton className="min-w-40 py-2.5" />
          <Skeleton className="min-w-36 py-2.5" />
        </div>
        <div className="flex flex-row gap-2 pb-4 pt-0">
          <Skeleton className="min-w-32 !rounded-full py-3" />
          <Skeleton className="min-w-20 !rounded-full py-3" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-0 py-0">
        <Skeleton className="w-full py-3" />
        <Skeleton className="min-w-48 py-3" />
      </CardContent>
    </Card>
  );
}