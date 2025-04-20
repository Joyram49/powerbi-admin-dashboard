"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import TokenVerifyForm from "../_components/TokenVerifyForm";

function VerifyOtpPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  if (!email) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Email Not Found
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Please return to the forgot password page and try again.
            </p>
            <div className="mt-6">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Back to forgot password
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 flex flex-col items-center">
          {/* Icon */}
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
            Verify OTP
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Please enter the 6-digit code sent to{" "}
            <span className="font-medium">{email}</span>
          </p>
        </div>

        <TokenVerifyForm email={email} />

        <div className="mt-6 text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Return to forgot password
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtpPage;
