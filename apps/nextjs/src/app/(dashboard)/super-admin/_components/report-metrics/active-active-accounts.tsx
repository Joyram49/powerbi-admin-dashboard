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
import ErrorCard from "./error-card";

async function ActiveAccountsCard() {
  try {
    const activeUsersResponse = await api.session.getActiveUsersCount();

    if (!activeUsersResponse.success) {
      return <ErrorCard message="Error fetching data" />;
    }

    return (
      <Card className="@container/card dark:bg-slate-900">
        <CardHeader className="relative">
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {activeUsersResponse.data.toLocaleString()}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Currently online <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Real-time user activity</div>
        </CardFooter>
      </Card>
    );
  } catch (error) {
    // Handle authentication errors gracefully
    return (
      <ErrorCard
        message={`Authentication required | ${error as Error}`}
        desc="Active accounts"
      />
    );
  }
}

export default ActiveAccountsCard;
