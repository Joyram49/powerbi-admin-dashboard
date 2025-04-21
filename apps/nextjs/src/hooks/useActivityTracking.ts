"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
interface StoredActivityData {
  lastEvent: string | null;
  lastActivity: string | null; // Stored as string in JSON
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

  // Check if there's a cookie that starts with "sb-" AND has a non-empty value
  return cookies.some((cookie) => {
    const [name, value] = cookie.trim().split("=");
    const isSessionCookie = name.startsWith("sb-");
    const hasValue = value && value.length > 0;

    return isSessionCookie && hasValue;
  });
}

// Helper to format time
function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
}

// Main hook for activity tracking
export function useActivityTracking() {
  // Track user login state
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false);

  // Activity data state - used regardless of login state
  const [activityData, setActivityData] = useState<ActivityData>({
    lastEvent: null,
    lastActivity: null,
    totalActiveTime: 0,
    totalInactiveTime: 0,
    isActive: false,
  });

  // Refs to avoid unnecessary re-renders - used only when logged in
  const isActiveRef = useRef(false);
  const lastActivityRef = useRef<Date | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeStartTimeRef = useRef<Date | null>(null);
  const inactiveStartTimeRef = useRef<Date | null>(null);
  const mouseMoveCountRef = useRef(0);

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
    activeStartTimeRef.current = null;
    inactiveStartTimeRef.current = null;
    mouseMoveCountRef.current = 0;

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Check login status and update state
  useEffect(() => {
    // Function to check login status and update state
    const checkLoginStatus = () => {
      const isLoggedIn = checkUserLoggedIn();

      // If login state changed
      if (isLoggedIn !== isUserLoggedIn) {
        setIsUserLoggedIn(isLoggedIn);

        // If user logged out, clear data
        if (!isLoggedIn) {
          localStorage.removeItem(STORAGE_KEY);
          resetActivityData();

          // Ensure all timers are cleared
          if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
          }

          // Reset all refs explicitly
          isActiveRef.current = false;
          lastActivityRef.current = null;
          activeStartTimeRef.current = null;
          inactiveStartTimeRef.current = null;
          mouseMoveCountRef.current = 0;
        }
      }
    };

    // Initial check
    checkLoginStatus();

    // Setup interval to check periodically
    const checkInterval = setInterval(checkLoginStatus, 5000);

    // Check when storage or visibility changes
    window.addEventListener("storage", checkLoginStatus);
    document.addEventListener("visibilitychange", checkLoginStatus);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener("storage", checkLoginStatus);
      document.removeEventListener("visibilitychange", checkLoginStatus);
    };
  }, [isUserLoggedIn, resetActivityData]);

  // Handle activity state transitions - only effective when logged in
  const handleActive = useCallback(() => {
    if (!isUserLoggedIn) return;

    if (!isActiveRef.current) {
      isActiveRef.current = true;
      activeStartTimeRef.current = new Date();

      if (inactiveStartTimeRef.current) {
        const inactiveDuration =
          Date.now() - inactiveStartTimeRef.current.getTime();

        setActivityData((prev) => ({
          ...prev,
          totalInactiveTime: prev.totalInactiveTime + inactiveDuration,
          isActive: true,
        }));

        inactiveStartTimeRef.current = null;
      } else {
        setActivityData((prev) => ({
          ...prev,
          isActive: true,
        }));
      }
    }
  }, [isUserLoggedIn]);

  const handleInactive = useCallback(() => {
    if (!isUserLoggedIn) return;

    if (isActiveRef.current) {
      isActiveRef.current = false;
      inactiveStartTimeRef.current = new Date();

      // Clear any pending inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }

      if (activeStartTimeRef.current) {
        const activeDuration =
          Date.now() - activeStartTimeRef.current.getTime();

        setActivityData((prev) => ({
          ...prev,
          totalActiveTime: prev.totalActiveTime + activeDuration,
          isActive: false,
        }));

        activeStartTimeRef.current = null;
      } else {
        setActivityData((prev) => ({
          ...prev,
          isActive: false,
        }));
      }
    }
  }, [isUserLoggedIn]);

  // Main function to update activity data - only effective when logged in
  const updateActivity = useCallback(
    (eventType: string) => {
      if (!isUserLoggedIn) return;

      // Special handling for mousemove to reduce frequency
      if (eventType === "mousemove") {
        mouseMoveCountRef.current++;
        if (mouseMoveCountRef.current % MOUSE_MOVE_THROTTLE !== 0) {
          // Still count as activity but don't process the event
          handleActive();
          return;
        }
      }

      const now = new Date();

      // Cancel any pending inactivity timeout and set a new one
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Set timer for inactivity
      inactivityTimerRef.current = setTimeout(() => {
        handleInactive();
      }, INACTIVITY_THRESHOLD);

      // Set the current activity state to active
      handleActive();

      // Update activity timestamp
      lastActivityRef.current = now;

      // Update activity data
      setActivityData((prev) => ({
        ...prev,
        lastEvent: eventType,
        lastActivity: now,
        isActive: true,
      }));
    },
    [handleActive, handleInactive, isUserLoggedIn],
  );

  // Load data from localStorage on login status change
  useEffect(() => {
    // Only load data if user is logged in
    if (!isUserLoggedIn) return;

    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        // Parse with type assertion and validation
        const parsedData = JSON.parse(savedData) as Partial<StoredActivityData>;

        // Validate required properties are numbers
        const totalActiveTime =
          typeof parsedData.totalActiveTime === "number"
            ? parsedData.totalActiveTime
            : 0;

        const totalInactiveTime =
          typeof parsedData.totalInactiveTime === "number"
            ? parsedData.totalInactiveTime
            : 0;

        // Convert string date to Date object if it exists
        const lastActivity = parsedData.lastActivity
          ? new Date(parsedData.lastActivity)
          : null;

        setActivityData((prev) => ({
          ...prev,
          totalActiveTime,
          totalInactiveTime,
          lastActivity,
        }));

        // Set refs to match initial state
        isActiveRef.current = false;
        lastActivityRef.current = lastActivity;
      }
    } catch {
      resetActivityData();
    }
  }, [isUserLoggedIn, resetActivityData]);

  // Save data to localStorage when it changes
  useEffect(() => {
    // Only save data if user is logged in
    if (!isUserLoggedIn) return;

    try {
      const dataToSave: StoredActivityData = {
        totalActiveTime: activityData.totalActiveTime,
        totalInactiveTime: activityData.totalInactiveTime,
        lastActivity: activityData.lastActivity
          ? activityData.lastActivity.toISOString()
          : null,
        lastEvent: activityData.lastEvent,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // Silent error handling
    }
  }, [activityData, isUserLoggedIn]);

  // Attach event listeners - only when logged in
  useEffect(() => {
    // Skip if not logged in
    if (!isUserLoggedIn) return;

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

  // Prepare formatted time strings
  const formattedActiveTime = formatTime(activityData.totalActiveTime);
  const formattedInactiveTime = formatTime(activityData.totalInactiveTime);

  return {
    isActive: isUserLoggedIn ? activityData.isActive : false,
    lastActivity: isUserLoggedIn ? activityData.lastActivity : null,
    lastEvent: isUserLoggedIn ? activityData.lastEvent : null,
    totalActiveTime: isUserLoggedIn ? activityData.totalActiveTime : 0,
    totalInactiveTime: isUserLoggedIn ? activityData.totalInactiveTime : 0,
    formattedActiveTime: isUserLoggedIn ? formattedActiveTime : "0h 0m 0s",
    formattedInactiveTime: isUserLoggedIn ? formattedInactiveTime : "0h 0m 0s",
    resetActivityData,
  };
}
