"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useActiveTimeTracker } from "~/hooks/userSessionsTrack";
import { api } from "~/trpc/react";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { totalActiveTime, sessionId } = useActiveTimeTracker();

  const trpcSignOut = api.auth.signOut.useMutation();
  const updateSession = api.session.updateSession.useMutation();

  const handleSignOut = async () => {
    try {
      setLoading(true);

      // 1️⃣ Try to update the session first
      await updateSession.mutateAsync({ sessionId, totalActiveTime });

      // 2️⃣ If session update succeeds, proceed with sign-out
      await trpcSignOut.mutateAsync();
      localStorage.removeItem("totalActiveTime");
      router.refresh();
      router.push("/login");
    } catch (error) {
      console.error("Sign-out error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      disabled={loading}
    >
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
}
