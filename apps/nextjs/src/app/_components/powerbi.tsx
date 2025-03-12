"use client";

import { useState } from "react";

import { Button } from "@acme/ui/button";

import { api } from "~/trpc/react";

export function PowerBIComponent() {
  const [isLoading, setIsLoading] = useState(false);

  const signOut = api.auth.signOut.useMutation({
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: () => {
      window.location.reload(); // Reload to show login page
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  return (
    <div className="flex h-screen w-screen flex-col">
      <header className="flex items-center justify-between bg-white p-4 shadow-md">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Button
          onClick={() => signOut.mutate()}
          disabled={isLoading}
          className="px-4 py-2"
        >
          {isLoading ? "Logging Out..." : "Log Out"}
        </Button>
      </header>

      <div className="relative flex-grow">
        <iframe
          src="https://app.powerbi.com/view?r=eyJrIjoiYTM0NTgyMDYtZTI1ZS00Yjg1LTgwNzYtNjU2M2RkNjcwY2UyIiwidCI6IjA3OTQ2ZjZmLTg1NzEtNGUyMi1iY2I0LTcxOTgwMWNkYjM4NiIsImMiOjF9"
          className="absolute inset-0 h-full w-full border-none"
          allowFullScreen
          title="PowerBI Dashboard"
        />
      </div>
    </div>
  );
}

export default PowerBIComponent;
