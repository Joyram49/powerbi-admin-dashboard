"use client";

import { useEffect, useRef } from "react";
import { TRPCClientError } from "@trpc/client";

import { useActivityTracking } from "~/hooks/useActivityTracking";
import { api } from "~/trpc/react";

// Constants
const SESSION_ID_STORAGE_KEY = "session_tracker_id";

// Define type for TRPC error data
interface TRPCErrorData {
  code?: string;
  httpStatus?: number;
  path?: string;
  message?: string;
}

/**
 * Simplified session tracking functionality that can be manually called
 * at specific points in the authentication flow.
 */
export function useSessionActivity() {
  // Store session ID and session start time only
  const sessionRef = useRef<{
    sessionId: string | null;
    sessionStartTime: number | null;
  }>({
    sessionId: null,
    sessionStartTime: null,
  });

  // Get activity tracking data - this already handles localStorage
  const activity = useActivityTracking();

  // API mutations and queries
  const createSession = api.session.createOrUpdateSession.useMutation();
  const updateSession = api.session.updateSession.useMutation();
  const getSession = api.session.getSessionByUserId.useQuery(undefined, {
    enabled: false,
    retry: false,
    onError: (error) => {
      // Silently handle errors for unauthenticated users
      if (
        error instanceof TRPCClientError &&
        typeof error.data === "object" &&
        error.data !== null
      ) {
        // Safely cast to our expected error data type
        const errorData = error.data as TRPCErrorData;
        if (errorData.code === "UNAUTHORIZED") {
          // Ignore unauthorized errors (expected for unauthenticated users)
          return;
        }
      }
      // Log all other errors
      console.error("Session query error:", error);
    },
  });

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const storedSessionId = localStorage.getItem(SESSION_ID_STORAGE_KEY);
      if (storedSessionId) {
        sessionRef.current.sessionId = storedSessionId;
      }
    } catch (error) {
      console.error("Error loading session ID from storage:", error);
    }
  }, []);

  // Handle page unload to save session data
  useEffect(() => {
    const handleBeforeUnload = () => {
      const { sessionId } = sessionRef.current;
      if (sessionId) {
        const totalActiveTime = activity.totalActiveTime;
        const endpoint = `/api/track/session/${sessionId}?activeTime=${totalActiveTime}`;
        navigator.sendBeacon(endpoint);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activity.totalActiveTime]);

  // Function to fetch current session from the server
  const fetchUserSession = async () => {
    try {
      const sessionData = await getSession.refetch();

      if (sessionData.data?.id) {
        const sessionId = sessionData.data.id;
        sessionRef.current.sessionId = sessionId;

        try {
          localStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);
        } catch (error) {
          console.error("Failed to save session ID to storage:", error);
        }

        return sessionId;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user session:", error);
      return null;
    }
  };

  // Function to create a new session (call after sign-in)
  const createUserSession = async () => {
    const existingSessionId = sessionRef.current.sessionId;
    if (existingSessionId) {
      return existingSessionId;
    }

    const fetchedSessionId = await fetchUserSession();
    if (fetchedSessionId) {
      return fetchedSessionId;
    }

    try {
      const response = await createSession.mutateAsync();
      if (response.success && response.data?.id) {
        const sessionId = response.data.id;
        sessionRef.current.sessionId = sessionId;

        try {
          localStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);
        } catch (error) {
          console.error("Failed to save session ID to storage:", error);
        }

        return sessionId;
      }
      return null;
    } catch (error) {
      console.error("Failed to create session:", error);
      return null;
    }
  };

  // Function to update a session (call before sign-out)
  const updateUserSession = async () => {
    let sessionId = sessionRef.current.sessionId;

    if (!sessionId) {
      try {
        sessionId = localStorage.getItem(SESSION_ID_STORAGE_KEY);
        if (sessionId) {
          sessionRef.current.sessionId = sessionId;
        }
      } catch (error) {
        console.error("Error retrieving session ID from storage:", error);
      }
    }

    if (!sessionId) {
      sessionId = await fetchUserSession();
    }

    if (!sessionId) {
      return false;
    }

    try {
      const response = await updateSession.mutateAsync({
        sessionId: sessionId,
        totalActiveTime: activity.totalActiveTime,
      });

      if (response.success) {
        sessionRef.current.sessionId = null;
        sessionRef.current.sessionStartTime = null;

        try {
          localStorage.removeItem(SESSION_ID_STORAGE_KEY);
        } catch (error) {
          console.error("Failed to remove session ID from storage:", error);
        }
      }

      return response.success;
    } catch (error) {
      console.error("Failed to update session:", error);
      return false;
    }
  };

  // Return functions that can be called at sign-in and sign-out
  return {
    createSession: createUserSession,
    updateSession: updateUserSession,
    getSessionId: async (fetchIfMissing = false) => {
      let sessionId = sessionRef.current.sessionId;

      if (!sessionId) {
        try {
          sessionId = localStorage.getItem(SESSION_ID_STORAGE_KEY);
          if (sessionId) {
            sessionRef.current.sessionId = sessionId;
          }
        } catch (error) {
          console.error("Error checking session ID in storage:", error);
        }
      }

      if (!sessionId && fetchIfMissing) {
        sessionId = await fetchUserSession();
      }

      return sessionId;
    },
    setSessionId: (id: string | null) => {
      sessionRef.current.sessionId = id;

      try {
        if (id) {
          localStorage.setItem(SESSION_ID_STORAGE_KEY, id);
        } else {
          localStorage.removeItem(SESSION_ID_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Error updating session ID in storage:", error);
      }
    },
    fetchSession: fetchUserSession,
    getActiveTime: () => activity.totalActiveTime,
  };
}
