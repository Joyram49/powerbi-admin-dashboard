"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@acme/ui/input-otp";
import { toast } from "@acme/ui/toast";

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
      toast.error("Error", {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        description: `${err}`,
      });
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {errorMessage && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Error
              </h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                <p>{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        <InputOTP maxLength={6} onChange={handleOTPChange} className="gap-2">
          <InputOTPGroup className="flex w-full items-center justify-center gap-2">
            <InputOTPSlot
              index={0}
              className="h-10 w-10 rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <InputOTPSlot
              index={1}
              className="h-10 w-10 rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <InputOTPSlot
              index={2}
              className="h-10 w-10 rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <InputOTPSlot
              index={3}
              className="h-10 w-10 rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <InputOTPSlot
              index={4}
              className="h-10 w-10 rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <InputOTPSlot
              index={5}
              className="h-10 w-10 rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </InputOTPGroup>
        </InputOTP>

        {/* Hidden input for form handling */}
        <input type="hidden" {...register("token")} />

        {errors.token && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.token.message}
          </p>
        )}
      </div>

      <div className="mt-6">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify OTP"
          )}
        </Button>
      </div>
    </form>
  );
}

export default TokenVerifyForm;
