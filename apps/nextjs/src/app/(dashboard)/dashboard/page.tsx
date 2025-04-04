import { Suspense } from "react";

import { SignOutButton } from "./_components/SignOutButton";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <SignOutButton />
        </Suspense>
      </div>

      <p className="my-4">
        Welcome to your dashboard! This is a protected page that should only be
        accessible after successfully logging in.
      </p>

      <div className="mt-8 rounded-md bg-gray-100 p-4">
        <h2 className="mb-2 text-lg font-semibold">Auth Status</h2>
        <p>You are currently logged in.</p>
        <p className="mt-2 text-sm text-gray-600">
          Click the Sign Out button to log out and clear all auth cookies.
        </p>
      </div>
    </div>
  );
}
