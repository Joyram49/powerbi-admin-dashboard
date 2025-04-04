"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";

import { env } from "~/env";
import { api } from "~/trpc/react";

export function AuthShowcase() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Signup Mutation
  const signUp = api.auth.signUp.useMutation({
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    },
    onSuccess: () => {
      setError(null);
      setIsLoading(false);
      setSignupSuccess(true);
      setIsSignup(false);
      setPassword("");
    },
  });

  // Signin Mutation
  const signIn = api.auth.signIn.useMutation({
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    },
    onSuccess: () => {
      setError(null);
      setIsLoggedIn(true);
    },
  });

  // Session query
  const sessionQuery = api.auth.getSession.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Signout Mutation
  const signOut = api.auth.signOut.useMutation({
    onSuccess: () => {
      setIsLoggedIn(false);
      setEmail("");
      setPassword("");
      window.location.reload();
    },
  });

  // Inactivity tracking
  useEffect(() => {
    // Only track if logged in
    if (!sessionQuery.data && !isLoggedIn) return;

    let inactivityTimeout: NodeJS.Timeout;
    let lastActivityTime = Date.now();

    const checkInactivity = () => {
      const currentTime = Date.now();
      const inactivityDuration = currentTime - lastActivityTime;

      // If inactive
      const inactiveDuration = env.NEXT_PUBLIC_INACTIVITY_TIMEOUT * 1000;
      if (inactivityDuration >= inactiveDuration) {
        signOut.mutate();
        return;
      }

      // Reset the timeout
      inactivityTimeout = setTimeout(checkInactivity, 1000);
    };

    const resetActivityTimer = () => {
      lastActivityTime = Date.now();
    };

    // List of events to track user activity
    const activityEvents = [
      // Mouse events
      "mousedown",
      "mouseup",
      "mousemove",
      "mouseenter",
      "mouseleave",
      "mouseover",
      "mouseout",
      "click",
      "dblclick",
      "contextmenu",
      "wheel",

      // Keyboard events
      "keydown",
      "keypress",
      "keyup",

      // Touch events
      "touchstart",
      "touchend",
      "touchmove",
      "touchcancel",

      // Pointer events
      "pointerdown",
      "pointerup",
      "pointermove",
      "pointerenter",
      "pointerleave",
      "pointerover",
      "pointerout",
      "pointercancel",

      // Focus-related events
      "focus",
      "blur",

      // Scroll and visibility events
      "scroll",
      "visibilitychange",

      //Default User activities
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "wheel",
    ];

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, resetActivityTimer);
    });

    // Start inactivity checking
    inactivityTimeout = setTimeout(checkInactivity, 1000);

    // Cleanup function
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetActivityTimer);
      });

      clearTimeout(inactivityTimeout);
    };
  }, [sessionQuery.data, isLoggedIn, signOut]);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Password strength validation for signup
    if (isSignup) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
      }
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /[0-9]/.test(password);

      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        setError("Password must include uppercase, lowercase, and numbers");
        return;
      }
    }

    // Proceed with signup or signin
    if (isSignup) {
      signUp.mutate({ email, password });
    } else {
      signIn.mutate({ email, password });
    }
  };

  // Loading state
  if (sessionQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-primary"></div>
      </div>
    );
  }

  // If logged in, render PowerBI component
  if (sessionQuery.data || isLoggedIn) {
    return <PowerBIComponent />;
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
      <AnimatePresence>
        {signupSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 rounded-md bg-green-100 p-3 text-center text-green-700"
          >
            Account created successfully! Please log in.
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 rounded-md bg-red-100 p-3 text-center text-red-700"
        >
          {error}
        </motion.div>
      )}

      <motion.div
        key={isSignup ? "signup" : "login"}
        initial={{ opacity: 0, x: isSignup ? 50 : -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <h2 className="mb-2 text-3xl font-bold text-gray-800">
              {isSignup ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-500">
              {isSignup
                ? "Sign up to access your dashboard"
                : "Log in to continue"}
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              disabled={isLoading}
              className={cn(
                "w-full rounded-md border p-3",
                "transition-all duration-300",
                "focus:outline-none focus:ring-2 focus:ring-primary",
                "disabled:opacity-50",
              )}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              disabled={isLoading}
              className={cn(
                "w-full rounded-md border p-3",
                "transition-all duration-300",
                "focus:outline-none focus:ring-2 focus:ring-primary",
                "disabled:opacity-50",
              )}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading
              ? isSignup
                ? "Creating Account..."
                : "Logging In..."
              : isSignup
                ? "Create Account"
                : "Log In"}
          </Button>
        </form>
      </motion.div>

      <div className="mt-6 text-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setIsSignup(!isSignup);
            setError(null);
            setSignupSuccess(false);
          }}
          disabled={isLoading}
        >
          {isSignup
            ? "Already have an account? Log In"
            : "Don't have an account? Sign Up"}
        </Button>
      </div>
    </div>
  );
}

const PowerBIComponent = dynamic(() => import("./powerbi"), {
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-primary"></div>
    </div>
  ),
});

export default AuthShowcase;
