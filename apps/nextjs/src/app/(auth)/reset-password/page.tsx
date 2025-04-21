import { Lock } from "lucide-react";

import { UpdatePasswordForm } from "../_components/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Update Your Password
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create a strong, unique password to protect your account
          </p>
        </div>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}