import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

export default function SkeletonCard() {
  return (
    <Card className="@container/card dark:bg-slate-900">
      <CardHeader className="relative">
        <CardDescription>
          <Skeleton className="h-4 w-24" />
        </CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold">
          <Skeleton className="mt-1 h-8 w-32" />
        </CardTitle>
        <div className="absolute right-4 top-4">
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardFooter>
    </Card>
  );
}
