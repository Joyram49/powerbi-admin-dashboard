"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@acme/ui/input-otp";

import { api } from "~/trpc/react";

const verifyOtpSchema = z.object({
  token: z
    .string()
    .min(6, { message: "OTP must be 6 characters" })
    .max(6, { message: "OTP must be 6 characters" }),
});

type FormValues = z.infer<typeof verifyOtpSchema>;
function TokenVerifyForm({ email }: { email: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
  } = useForm<FormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      token: "",
    },
  });

  const verifyOTP = api.auth.verifyOTP.useMutation({
    onSuccess: (response) => {
      if (response.success) {
        setErrorMessage(null);
        // Redirect to reset password page with email param
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        setErrorMessage(response.message || "Verification failed");
        setIsSubmitting(false);
      }
    },
    onError: (error) => {
      setErrorMessage(
        error.message || "Verification failed. Please try again.",
      );
      setIsSubmitting(false);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleOTPChange = (value: string) => {
    setValue("token", value, { shouldValidate: true });

    // If we have 6 digits, automatically trigger validation and submit
    if (value.length === 6) {
      trigger("token")
        .then((isValid) => {
          if (isValid) {
            void handleSubmit(onSubmit)();
          }
        })
        .catch((error) => {
          console.error("Validation error:", error);
        });
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await verifyOTP.mutateAsync({ email, token: data.token });
    } catch (err) {
      // Error is handled in the mutation callbacks
      console.log(err);
    }
  };
  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {errorMessage && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="-space-y-px rounded-md shadow-sm">
        <div>
          {/* <label htmlFor="token" className="sr-only">
                OTP
              </label>
              <input
                id="token"
                type="text"
                {...register("token")}
                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="6-digit OTP"
                maxLength={6}
              /> */}

          <InputOTP maxLength={6} onChange={handleOTPChange}>
            <InputOTPGroup className="flex w-full items-center justify-center gap-x-2">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          {/* Hidden input for form handling */}
          <input type="hidden" {...register("token")} />

          {errors.token && (
            <p className="mt-1 text-sm text-red-600">{errors.token.message}</p>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? "Verifying..." : "Verify OTP"}
        </button>
      </div>
    </form>
  );
}

export default TokenVerifyForm;
