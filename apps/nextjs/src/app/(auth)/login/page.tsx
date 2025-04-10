import { Suspense } from "react";

import { SignInForm } from "../_components/sign-in-form";

function AuthShowcaseSkeleton() {
  return (
    <div className="flex animate-pulse flex-col items-center justify-center gap-4">
      <div className="h-10 w-64 rounded bg-gray-200"></div>
      <div className="h-12 w-48 rounded bg-gray-300"></div>
    </div>
  );
}

function SignInPage() {
  return (
    <Suspense fallback={<AuthShowcaseSkeleton />}>
      {/* <AuthShowcase /> */}
      <div className="flex w-full flex-col gap-4 p-4">
        <SignInForm />
      </div>
    </Suspense>
  );
}

export default SignInPage;
