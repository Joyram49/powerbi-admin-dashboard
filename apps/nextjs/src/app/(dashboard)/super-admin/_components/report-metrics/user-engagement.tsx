"use client";

import { ClockIcon } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { api } from "~/trpc/react";
import { formatDuration } from "~/utils/formatDuration";
import ErrorCard from "./error-card";
import SkeletonCard from "./skeleton-card";

function UserEngagementCard() {
  const {
    data: totalActiveTimeResponse,
    isError,
    error,
    isLoading,
  } = api.session.getTotalActiveTime.useQuery(undefined, {
    // Set short timeout to prevent hanging
    retry: 1,
    retryDelay: 500,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30000, // 30 seconds
    cacheTime: 60000, // 1 minute
  });

  // Show skeleton loader during loading state
  if (isLoading) {
    return <SkeletonCard title="User Engagement" />;
  }

  if (isError) {
    return (
      <ErrorCard
        message={error.message || "Not authorized to view this data"}
      />
    );
  }

  // Use fallback 0 if data is missing or not a number
  const engagementSeconds =
    totalActiveTimeResponse.data &&
    typeof totalActiveTimeResponse.data === "number"
      ? totalActiveTimeResponse.data
      : 0;

  const displayTime = formatDuration(engagementSeconds);

  return (
    <Card className="@container/card dark:bg-slate-900">
      <CardHeader className="relative">
        <CardDescription>User Engagement</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
          {displayTime}
        </CardTitle>
        <div className="absolute right-4 top-4">
          <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
            <ClockIcon className="size-3" />
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          Total active time <ClockIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">Platform engagement metrics</div>
      </CardFooter>
    </Card>
  );
}

export default UserEngagementCard;
