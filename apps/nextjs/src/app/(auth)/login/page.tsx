import { Suspense } from "react";

import { SignInForm } from "../_components/SignInForm";

function AuthShowcaseSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
      <div className="w-full animate-pulse rounded-lg border bg-gray-100 dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="border-b bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>

        {/* Form Content */}
        <div className="space-y-6 p-6">
          {/* Email Field */}
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>

          {/* Submit Button */}
          <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700"></div>

          {/* Forgot Password Link */}
          <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    </div>
  );
}

// Wrap the SignInForm in a Suspense boundary
function SignInFormWithSuspense() {
  return (
    <Suspense fallback={<AuthShowcaseSkeleton />}>
      <SignInForm />
    </Suspense>
  );
}

export default function SignInPage() {
  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <SignInFormWithSuspense />
    </div>
  );
}
