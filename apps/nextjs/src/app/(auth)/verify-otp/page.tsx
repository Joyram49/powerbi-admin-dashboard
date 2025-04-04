"use client";

import { useSearchParams } from "next/navigation";

import TokenVerifyForm from "./_components/token-verify-form";

function VerifyOtpPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  if (!email) {
    return <div>No email found!</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify OTP
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter the 6-digit code sent to your email
          </p>
        </div>

        <TokenVerifyForm email={email} />
      </div>
    </div>
  );
}

export default VerifyOtpPage;
