import { Skeleton } from "@acme/ui/skeleton";

export default function ReportsPageSkeleton() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>

      <div className="rounded-md border">
        <div className="bg-muted/50 p-4">
          <div className="flex w-full gap-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-6 flex-1" />
              ))}
          </div>
        </div>
        <div className="p-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex w-full gap-4 py-4">
                {Array(6)
                  .fill(0)
                  .map((_, j) => (
                    <Skeleton key={j} className="h-6 flex-1" />
                  ))}
              </div>
            ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <div className="flex items-center space-x-2">
          {Array(7)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-10 w-10" />
            ))}
        </div>
      </div>
    </div>
  );
}
