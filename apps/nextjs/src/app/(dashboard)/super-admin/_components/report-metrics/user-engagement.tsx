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

async function UserEngagementCard() {
  const totalActiveTimeResponse = await api.session.getTotalActiveTime();

  // Check if the response is successful and contains data
  if (!totalActiveTimeResponse.success) {
    return (
      <Card className="@container/card dark:bg-slate-900">
        <CardHeader className="relative">
          <CardDescription>Error fetching data</CardDescription>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">
            Unable to retrieve engagement data.
          </div>
        </CardFooter>
      </Card>
    );
  }

  // Convert seconds to human-readable format
  const totalSeconds = totalActiveTimeResponse.data as number;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  // Format display string
  const displayTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

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
