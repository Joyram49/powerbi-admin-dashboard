import React from "react";

import { Badge } from "@acme/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let color: "default" | "success" | "warning" | "destructive" = "default";
  if (status === "paid") color = "success";
  else if (status === "pending") color = "warning";
  else if (status === "failed") color = "destructive";
  return <Badge variant={color}>{status}</Badge>;
}
