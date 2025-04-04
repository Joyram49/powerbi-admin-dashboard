import Link from "next/link";

import { ForgotPasswordForm } from "./_components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md">
        <div className="mb-6 flex flex-col items-center">
          {/* App logo/icon */}
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-center text-2xl font-bold text-gray-900">
            Forgot Password
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your email to recieve a verification code
          </p>
        </div>

        <ForgotPasswordForm />

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
}
