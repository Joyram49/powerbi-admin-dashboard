"use client";

import { TrendingUpIcon } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { api } from "~/trpc/react";
import SkeletonCard from "./skeleton-card";

function ActiveAccountsCard() {
  const {
    data: activeAccounts,
    isLoading,
    isError,
    error,
    isSuccess,
  } = api.user.getLoggedInUsersCount.useQuery();

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (isError) {
    return (
      <Card className="h-40 bg-red-100 dark:bg-red-800">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
        <CardFooter>
          <div className="text-red-600">Failed to fetch active accounts</div>
        </CardFooter>
      </Card>
    );
  }
  if (!isSuccess || !activeAccounts.success || activeAccounts.count === 0) {
    return (
      <Card className="h-40 bg-gray-100 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>0</CardTitle>
          <CardDescription>No active accounts found</CardDescription>
        </CardHeader>
        <CardFooter>
          <div className="text-gray-600">Please check back later</div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="@container/card border-gray-200 dark:border-gray-800 dark:bg-slate-900">
      <CardHeader className="relative">
        <CardDescription>Active Accounts</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
          {activeAccounts.count}
        </CardTitle>
        <div className="absolute right-4 top-4">
          <Badge
            variant="outline"
            className="flex gap-1 rounded-lg border-gray-200 text-xs dark:border-gray-800"
          >
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
}

export default ActiveAccountsCard;
