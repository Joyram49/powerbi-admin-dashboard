import { TrendingDownIcon } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { api } from "~/trpc/server";
import ErrorCard from "./error-card";

async function TotalReportsCard() {
  try {
    const totalReports = await api.report.getAllReports();

    // Check if the response is successful and contains total
    if (!totalReports.success) {
      return <ErrorCard message="Authentication required" />;
    }

    return (
      <Card className="@container/card dark:bg-slate-900">
        <CardHeader className="relative">
          <CardDescription>Total Reports</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {totalReports.total}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingDownIcon className="size-3" />
              -20%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down 20% this period <TrendingDownIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Acquisition needs attention
          </div>
        </CardFooter>
      </Card>
    );
  } catch (error) {
    return (
      <ErrorCard
        message={`Authentication required | ${error as Error}`}
        desc="Total reports"
      />
    );
  }
}

export default TotalReportsCard;
