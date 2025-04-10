import { TrendingUpIcon } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { api } from "~/trpc/server";

async function TotalUsersCard() {
  const totalUsersResponse = await api.user.getAllActiveUsers();

  // Check if the response is successful and contains total
  if (!totalUsersResponse.success) {
    return (
      <Card className="@container/card dark:bg-slate-900">
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
    <Card className="@container/card dark:bg-slate-900">
      <CardHeader className="relative">
        <CardDescription>Total Users</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
          {totalUsersResponse.users}
        </CardTitle>
        <div className="absolute right-4 top-4">
          <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
            <TrendingUpIcon className="size-3" />
            +12.5%
          </Badge>
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          Trending up this month <TrendingUpIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">
          Visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}

export default TotalUsersCard;
