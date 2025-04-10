"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "~/trpc/react";

// const INACTIVITY_THRESHOLD = 10_000;
const ACTIVE_TIME_KEY = "totalActiveTime";

export function useActiveTimeTracker() {
  const [totalActiveTime, setTotalActiveTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const wasSessionActive = useRef(false);

  const { data: session, isLoading } = api.session.getSessionByUserId.useQuery(
    undefined,
    {
      enabled: typeof window !== "undefined",
      staleTime: 1000 * 60 * 5,
      retry: false,
    },
  );

  // Load totalActiveTime from localStorage on mount
  useEffect(() => {
    const savedTime = localStorage.getItem(ACTIVE_TIME_KEY);
    if (savedTime) {
      setTotalActiveTime(parseInt(savedTime));
    }
  }, []);

  // Reset localStorage after logout
  useEffect(() => {
    if (isLoading) return;

    if (session) {
      wasSessionActive.current = true;
      setSessionId(session.id);
    } else if (!session && wasSessionActive.current) {
      // User just logged out
      localStorage.removeItem(ACTIVE_TIME_KEY);
      setTotalActiveTime(0);
      setSessionId(null);
      wasSessionActive.current = false;
    }
  }, [session, isLoading]);

  // Start counting when session exists
  useEffect(() => {
    if (!session || isLoading) return;

    lastActivityRef.current = Date.now();

    const isPageActive = () =>
      document.visibilityState === "visible" && document.hasFocus();

    const tick = () => {
      if (isPageActive()) {
        setTotalActiveTime((prev) => {
          const updated = prev + 1000;
          localStorage.setItem(ACTIVE_TIME_KEY, updated.toString());
          return updated;
        });
      }
    };

    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session, isLoading]);

  return { totalActiveTime, sessionId };
}
