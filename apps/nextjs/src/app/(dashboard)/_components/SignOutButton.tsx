"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "~/trpc/react";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const trpcSignOut = api.auth.signOut.useMutation();

  const handleSignOut = async () => {
    try {
      setLoading(true);
      // First, call the tRPC endpoint to handle server-side signout
      router.refresh(); // Force refresh to clear any cached state
      await trpcSignOut.mutateAsync();

      // Redirect to login page
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
