import { ClockIcon } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

// Adjust path as needed
import { api } from "~/trpc/server";
import { formatDuration } from "~/utils/formatDuration";
import ErrorCard from "./error-card";

async function UserEngagementCard() {
  try {
    const totalActiveTimeResponse = await api.session.getTotalActiveTime();

    if (!totalActiveTimeResponse.success) {
      return <ErrorCard message="Authentication required" />;
    }

    const totalSeconds = totalActiveTimeResponse.data as number;
    const displayTime = formatDuration(totalSeconds);

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
          <div className="text-muted-foreground">
            Platform engagement metrics
          </div>
        </CardFooter>
      </Card>
    );
  } catch (error) {
    return (
      <ErrorCard
        message={`Authentication required | ${error as Error}`}
        desc="User engagements"
      />
    );
  }
}

export default UserEngagementCard;
