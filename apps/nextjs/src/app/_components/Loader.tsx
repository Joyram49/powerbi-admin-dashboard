export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md animate-pulse rounded-xl bg-white p-8 shadow-md">
        <div className="mb-6 flex justify-center">
          <div className="h-10 w-32 rounded bg-gray-300" />
        </div>

        <div className="mx-auto mb-6 h-6 w-24 rounded bg-gray-300" />

        <div className="space-y-4">
          {/* Email field skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-300" />
            <div className="h-10 rounded bg-gray-200" />
          </div>

          {/* Password field skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-300" />
            <div className="h-10 rounded bg-gray-200" />
          </div>

          {/* Forgot password skeleton */}
          <div className="h-4 w-32 rounded bg-gray-200" />

          {/* Sign In button skeleton */}
          <div className="h-10 rounded bg-gray-300" />
        </div>

        <div className="mt-6 flex justify-center">
          <div className="h-4 w-40 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
