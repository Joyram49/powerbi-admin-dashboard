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

function ActiveAccountsCard() {
  return (
    <Card className="@container/card border-gray-200 dark:border-gray-800 dark:bg-slate-900">
      <CardHeader className="relative">
        <CardDescription>Active Accounts</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
          0
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
