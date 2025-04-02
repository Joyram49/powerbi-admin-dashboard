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

async function TotalReportsCard() {
  const totalReports = await api.report.getAllReports();

  // Check if the response is successful and contains total
  if (!totalReports.success) {
    return (
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Error fetching data</CardDescription>{" "}
          {/* Display an error message */}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">
            Unable to retrieve user data.
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
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
        <div className="text-muted-foreground">Acquisition needs attention</div>
      </CardFooter>
    </Card>
  );
}

export default TotalReportsCard;
