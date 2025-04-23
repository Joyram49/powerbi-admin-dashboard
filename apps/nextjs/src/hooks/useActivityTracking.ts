"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Interface for activity events
export interface ActivityEvent {
  type: string;
  time: string;
}

// Core activity data structure
interface ActivityData {
  lastEvent: string | null;
  lastActivity: Date | null;
  totalActiveTime: number;
  totalInactiveTime: number;
  isActive: boolean;
}

// Define type for saved data in localStorage
export interface StoredActivityData {
  lastEvent: string | null;
  lastActivity: string | null;
  totalInactiveTime: number;
  totalActiveTime: number;
}

// Define tracked events
const TRACKED_EVENTS = [
  "mousemove",
  "mousedown",
  "mouseup",
  "click",
  "dblclick",
  "keydown",
  "keyup",
  "scroll",
  "wheel",
  "touchstart",
  "touchmove",
  "touchend",
  "focus",
  "blur",
  "resize",
  "visibilitychange",
];

// Constants
const INACTIVITY_THRESHOLD = 10000; // 10 seconds of inactivity
const STORAGE_KEY = "userActivityData";
const MOUSE_MOVE_THROTTLE = 5; // Only process 1 in 5 mousemove events

// Check if user is logged in by checking for sb- cookies
function checkUserLoggedIn(): boolean {
  if (typeof document === "undefined") return false;

  const cookies = document.cookie.split(";");

  return cookies.some((cookie) => {
    const parts = cookie.trim().split("=");
    const name = parts[0];
    const value = parts.length > 1 ? parts[1] : "";

    if (!name) return false;

    const isSessionCookie = name.startsWith("sb-");
    const hasValue = value && value.length > 0;

    return isSessionCookie && hasValue;
  });
}

// Main hook for activity tracking
export function useActivityTracking() {
  // Track user login state
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false);

  // Activity data state
  const [activityData, setActivityData] = useState<ActivityData>({
    lastEvent: null,
    lastActivity: null,
    totalActiveTime: 0,
    totalInactiveTime: 0,
    isActive: false,
  });

  // Refs to avoid unnecessary re-renders
  const isActiveRef = useRef(false);
  const lastActivityRef = useRef<Date | null>(null);
  const lastEventRef = useRef<string | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeStartTimeRef = useRef<Date | null>(null);
  const inactiveStartTimeRef = useRef<Date | null>(null);
  const mouseMoveCountRef = useRef(0);

  // Store base accumulated times to avoid resetting during state transitions
  const baseTimesRef = useRef({
    baseActiveTime: 0,
    baseInactiveTime: 0,
  });

  // Calculate current real-time values
  const getCurrentTimes = useCallback(() => {
    const now = Date.now();
    let currentActiveTime = baseTimesRef.current.baseActiveTime;
    let currentInactiveTime = baseTimesRef.current.baseInactiveTime;

    // If actively using the site, add to active time
    if (isActiveRef.current && activeStartTimeRef.current) {
      const additionalActiveTime = now - activeStartTimeRef.current.getTime();
      currentActiveTime += additionalActiveTime;
    }

    // If in an inactive state, add to inactive time
    if (!isActiveRef.current && inactiveStartTimeRef.current) {
      const additionalInactiveTime =
        now - inactiveStartTimeRef.current.getTime();
      currentInactiveTime += additionalInactiveTime;
    }

    return {
      totalActiveTime: currentActiveTime,
      totalInactiveTime: currentInactiveTime,
    };
  }, []);

  // Reset activity tracking data
  const resetActivityData = useCallback(() => {
    setActivityData({
      lastEvent: null,
      lastActivity: null,
      totalActiveTime: 0,
      totalInactiveTime: 0,
      isActive: false,
    });

    // Reset refs
    isActiveRef.current = false;
    lastActivityRef.current = null;
    lastEventRef.current = null;
    activeStartTimeRef.current = null;
    inactiveStartTimeRef.current = null;
    mouseMoveCountRef.current = 0;
    baseTimesRef.current = {
      baseActiveTime: 0,
      baseInactiveTime: 0,
    };

    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Check login status and update state
  useEffect(() => {
    const checkLoginStatus = () => {
      const isLoggedIn = checkUserLoggedIn();

      if (isLoggedIn !== isUserLoggedIn) {
        setIsUserLoggedIn(isLoggedIn);

        if (!isLoggedIn) {
          localStorage.removeItem(STORAGE_KEY);
          resetActivityData();

          if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
          }

          isActiveRef.current = false;
          lastActivityRef.current = null;
          lastEventRef.current = null;
          activeStartTimeRef.current = null;
          inactiveStartTimeRef.current = null;
          mouseMoveCountRef.current = 0;
          baseTimesRef.current = {
            baseActiveTime: 0,
            baseInactiveTime: 0,
          };
        }
      }
    };

    checkLoginStatus();

    const checkInterval = setInterval(checkLoginStatus, 5000);

    window.addEventListener("storage", checkLoginStatus);
    document.addEventListener("visibilitychange", checkLoginStatus);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener("storage", checkLoginStatus);
      document.removeEventListener("visibilitychange", checkLoginStatus);
    };
  }, [isUserLoggedIn, resetActivityData]);

  // Handle activity state transitions
  const handleActive = useCallback(() => {
    if (!isUserLoggedIn) return;

    if (!isActiveRef.current) {
      // If transitioning from inactive to active, finalize inactive time
      if (inactiveStartTimeRef.current) {
        const now = Date.now();
        const inactiveDuration = now - inactiveStartTimeRef.current.getTime();

        baseTimesRef.current.baseInactiveTime += inactiveDuration;
        inactiveStartTimeRef.current = null;
      }

      isActiveRef.current = true;
      activeStartTimeRef.current = new Date();

      // Important: Store current times, but don't create a new dependency on activityData
      const { totalActiveTime, totalInactiveTime } = getCurrentTimes();

      // Set state with active flag and current calculated times
      setActivityData((prev) => ({
        ...prev,
        isActive: true,
        totalActiveTime,
        totalInactiveTime,
      }));

      // Save to localStorage with the current data, not creating a circular reference
      try {
        const dataToSave: StoredActivityData = {
          totalActiveTime,
          totalInactiveTime,
          lastActivity: lastActivityRef.current
            ? lastActivityRef.current.toISOString()
            : null,
          lastEvent: lastEventRef.current,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch {
        // Silent error handling
      }
    }
  }, [isUserLoggedIn, getCurrentTimes]);

  const handleInactive = useCallback(() => {
    if (!isUserLoggedIn) return;

    if (isActiveRef.current) {
      // If transitioning from active to inactive, finalize active time
      if (activeStartTimeRef.current) {
        const now = Date.now();
        const activeDuration = now - activeStartTimeRef.current.getTime();

        baseTimesRef.current.baseActiveTime += activeDuration;
        activeStartTimeRef.current = null;
      }

      isActiveRef.current = false;
      inactiveStartTimeRef.current = new Date();

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }

      // Important: Store current times, but don't create a new dependency on activityData
      const { totalActiveTime, totalInactiveTime } = getCurrentTimes();

      // Set state with inactive flag and current calculated times
      setActivityData((prev) => ({
        ...prev,
        isActive: false,
        totalActiveTime,
        totalInactiveTime,
      }));

      // Save to localStorage with the current data, not creating a circular reference
      try {
        const dataToSave: StoredActivityData = {
          totalActiveTime,
          totalInactiveTime,
          lastActivity: lastActivityRef.current
            ? lastActivityRef.current.toISOString()
            : null,
          lastEvent: lastEventRef.current,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch {
        // Silent error handling
      }
    }
  }, [isUserLoggedIn, getCurrentTimes]);

  // Main function to update activity data
  const updateActivity = useCallback(
    (eventType: string) => {
      if (!isUserLoggedIn) return;

      // Special handling for mousemove to reduce frequency
      if (eventType === "mousemove") {
        mouseMoveCountRef.current++;
        if (mouseMoveCountRef.current % MOUSE_MOVE_THROTTLE !== 0) {
          handleActive();
          return;
        }
      }

      const now = new Date();

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        handleInactive();
      }, INACTIVITY_THRESHOLD);

      handleActive();

      lastActivityRef.current = now;
      lastEventRef.current = eventType;

      // Update activity state by reading from prev state, not activityData directly
      const { totalActiveTime, totalInactiveTime } = getCurrentTimes();

      setActivityData((prev) => ({
        ...prev,
        lastEvent: eventType,
        lastActivity: now,
        isActive: true,
        totalActiveTime,
        totalInactiveTime,
      }));

      // Save updated data to localStorage
      try {
        const dataToSave: StoredActivityData = {
          totalActiveTime,
          totalInactiveTime,
          lastActivity: now.toISOString(),
          lastEvent: eventType,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch {
        // Silent error handling
      }
    },
    [handleActive, handleInactive, isUserLoggedIn, getCurrentTimes],
  );

  // Load data from localStorage on login status change
  useEffect(() => {
    if (!isUserLoggedIn) return;

    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData) as Partial<StoredActivityData>;

        const totalActiveTime =
          typeof parsedData.totalActiveTime === "number"
            ? parsedData.totalActiveTime
            : 0;

        const totalInactiveTime =
          typeof parsedData.totalInactiveTime === "number"
            ? parsedData.totalInactiveTime
            : 0;

        const lastActivity = parsedData.lastActivity
          ? new Date(parsedData.lastActivity)
          : null;

        baseTimesRef.current = {
          baseActiveTime: totalActiveTime,
          baseInactiveTime: totalInactiveTime,
        };

        setActivityData((prev) => ({
          ...prev,
          totalActiveTime,
          totalInactiveTime,
          lastActivity,
        }));

        isActiveRef.current = false;
        lastActivityRef.current = lastActivity;
        // Ensure lastEventRef is always a string or null
        lastEventRef.current = parsedData.lastEvent ?? null;
      }
    } catch {
      resetActivityData();
    }
  }, [isUserLoggedIn, resetActivityData]);

  // Make sure we save the final state when component unmounts
  useEffect(() => {
    return () => {
      if (isUserLoggedIn) {
        // Get the latest calculated times
        const { totalActiveTime, totalInactiveTime } = getCurrentTimes();

        // Save final state without creating a dependency on activityData
        try {
          const dataToSave: StoredActivityData = {
            totalActiveTime,
            totalInactiveTime,
            lastActivity: lastActivityRef.current
              ? lastActivityRef.current.toISOString()
              : null,
            lastEvent: lastEventRef.current,
          };

          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        } catch {
          // Silent error handling
        }
      }
    };
  }, [isUserLoggedIn, getCurrentTimes]);

  // Attach event listeners - only when logged in
  useEffect(() => {
    if (!isUserLoggedIn) return;

    // Initialize activity period if needed
    if (!activeStartTimeRef.current && !inactiveStartTimeRef.current) {
      isActiveRef.current = true;
      activeStartTimeRef.current = new Date();

      setActivityData((prev) => ({
        ...prev,
        isActive: true,
      }));
    }

    const handleEvent = (e: Event) => {
      updateActivity(e.type);
    };

    // Register all event listeners
    TRACKED_EVENTS.forEach((eventType) => {
      window.addEventListener(eventType, handleEvent, { passive: true });
    });

    // Setup initial inactivity timer if needed
    if (!inactivityTimerRef.current) {
      inactivityTimerRef.current = setTimeout(() => {
        handleInactive();
      }, INACTIVITY_THRESHOLD);
    }

    // Cleanup listeners
    return () => {
      TRACKED_EVENTS.forEach((eventType) => {
        window.removeEventListener(eventType, handleEvent);
      });

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [updateActivity, handleInactive, isUserLoggedIn]);

  // Memoize return values to prevent unnecessary re-renders
  const returnValues = useMemo(
    () => ({
      isActive: isUserLoggedIn ? activityData.isActive : false,
      lastActivity: isUserLoggedIn ? activityData.lastActivity : null,
      lastEvent: isUserLoggedIn ? activityData.lastEvent : null,
      // Return real-time values from the ref when needed
      totalActiveTime: isUserLoggedIn ? getCurrentTimes().totalActiveTime : 0,
      totalInactiveTime: isUserLoggedIn
        ? getCurrentTimes().totalInactiveTime
        : 0,
      resetActivityData,
    }),
    [
      isUserLoggedIn,
      activityData.isActive,
      activityData.lastActivity,
      activityData.lastEvent,
      getCurrentTimes,
      resetActivityData,
    ],
  );

  return returnValues;
}
