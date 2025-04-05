"use client";

import { useActiveTimeTracker } from "~/hooks/userSessionsTrack";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionData = useActiveTimeTracker();
  console.log("session data", sessionData);

  return <>{children}</>;
}
