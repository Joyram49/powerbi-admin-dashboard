"use client";
export default function Dashboard() {

  return (
    <>
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Redirecting to dashboard...</h2>
          <div className="mt-4 h-2 w-40 rounded-full bg-gray-200">
            <div className="h-2 animate-pulse rounded-full bg-blue-500"></div>
          </div>
        </div>
      </div>
    </>
  );
}
