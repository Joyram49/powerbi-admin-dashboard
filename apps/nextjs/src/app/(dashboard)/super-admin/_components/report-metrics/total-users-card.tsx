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
import ErrorCard from "./error-card";
import SkeletonCard from "./skeleton-card";

function TotalUsersCard() {
  const {
    data: totalUsersResponse,
    isError,
    error,
    isLoading,
  } = api.user.getAllActiveUsers.useQuery(undefined, {
    // Only run this query if the component is mounted (client-side)
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (isError) {
    console.error("Error fetching total users:", error);

    // Handle unauthorized error
    if (error.data?.code === "UNAUTHORIZED") {
      return <ErrorCard message="Not authorized to view this data" />;
    }

    return (
      <ErrorCard message={error.message || "Failed to fetch total users"} />
    );
  }

  if (!totalUsersResponse?.users) {
    return <ErrorCard message="No user data available" />;
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
