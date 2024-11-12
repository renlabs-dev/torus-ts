import { Card, CardHeader, CardContent, Skeleton } from "@torus-ts/ui";

export function CardSkeleton(): JSX.Element {
  return (
    <Card className="p-6">
      <CardHeader className="flex flex-row items-center justify-between px-0 pt-0 pb-5 space-y-0">
        <div className="flex items-center gap-5 w-fit">
          <Skeleton className="py-3 min-w-40" />
          <Skeleton className="py-3 min-w-36" />
        </div>
        <div className="flex gap-2 pt-0 mt-0">
          <Skeleton className="py-4 !rounded-full min-w-32" />
          <Skeleton className="py-4 !rounded-full min-w-20" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-0 py-0">
        <Skeleton className="w-2/3 py-4" />
        <Skeleton className="py-3 min-w-48" />
      </CardContent >
    </Card >
  );
}
