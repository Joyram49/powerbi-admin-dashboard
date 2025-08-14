"use client";

import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";

import SignInOtpForm from "../_components/SignInOtpForm";

function VerifyOtpContent() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 flex flex-col items-center">
          {/* Icon */}
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
            Verify Signin OTP
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Please enter the 6-digit code sent to your email
          </p>
        </div>

        <SignInOtpForm />
      </div>
    </div>
  );
}

function VerifySigninOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center px-4 py-12 dark:bg-gray-900">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-6 flex flex-col items-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
                Loading...
              </h2>
            </div>
          </div>
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}

export default VerifySigninOtpPage;
