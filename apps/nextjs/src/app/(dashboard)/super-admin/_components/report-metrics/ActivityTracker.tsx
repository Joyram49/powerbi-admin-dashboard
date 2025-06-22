"use client";

import type { ReactNode } from "react";

import { useActivityTracking } from "~/hooks/useActivityTracking";

interface ActivityTrackerProps {
  children: ReactNode;
}

/**
 * Activity tracking component that only tracks user activity without session management.
 * Session management is now handled explicitly in sign-in and sign-out components.
 */
export function ActivityTracker({ children }: ActivityTrackerProps) {
  // Track user activity locally - no session management here
  useActivityTracking();

  return <>{children}</>;
}
