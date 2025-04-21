"use client";

import Link from "next/link";

import { Button } from "@acme/ui/button";

export default function CancelPage() {
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Payment Cancelled
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your subscription process was cancelled. No charges were made.
          </p>
        </div>
        <Link href="/billing">
          <Button className="w-full">Return to Billing Page</Button>
        </Link>
      </div>
    </div>
  );
}
