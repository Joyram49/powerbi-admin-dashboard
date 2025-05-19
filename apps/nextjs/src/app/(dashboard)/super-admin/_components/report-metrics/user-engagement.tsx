import { ClockIcon } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { api } from "~/trpc/server";
import { formatDuration } from "~/utils/formatDuration";
import ErrorCard from "./error-card";

async function UserEngagementCard() {
  try {
    // Fetch data directly in the server component
    const totalActiveTimeResponse = await api.session.getTotalActiveTime();

    // Extract the engagement seconds safely
    const engagementSeconds =
      totalActiveTimeResponse.data &&
      typeof totalActiveTimeResponse.data === "number"
        ? totalActiveTimeResponse.data
        : 0;

    const displayTime = formatDuration(engagementSeconds);

    return (
      <Card className="@container/card border-gray-200 dark:border-gray-800 dark:bg-slate-900">
        <CardHeader className="relative">
          <CardDescription>User Engagement</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {displayTime}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex border-gray-200 dark:border-gray-800 gap-1 rounded-lg text-xs">
              <ClockIcon className="size-3" />
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total active time <ClockIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Platform engagement metrics
          </div>
        </CardFooter>
      </Card>
    );
  } catch (error) {
    return (
      <ErrorCard
        message={(error as Error).message || "Not authorized to view this data"}
      />
    );
  }
}

export default UserEngagementCard;
