"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@acme/ui/input-otp";
import { toast } from "@acme/ui/toast";

import { useSessionActivity } from "~/hooks/useSessionActivity";
import { api } from "~/trpc/react";
import { ROLE_ROUTES } from "~/utils/routes";

const verifySigninOtpSchema = z.object({
  token: z
    .string()
    .min(6, { message: "OTP must be 6 characters" })
    .max(6, { message: "OTP must be 6 characters" }),
  rememberMe: z.boolean().optional().default(false),
});

type FormValues = z.infer<typeof verifySigninOtpSchema>;

interface TempCredentials {
  email: string;
  password: string;
}

function SignInOtpForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tempCredentials, setTempCredentials] =
    useState<TempCredentials | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasSentOnce, setHasSentOnce] = useState(false);
  const router = useRouter();
  const { createSession } = useSessionActivity();
  const utils = api.useUtils();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
  } = useForm<FormValues>({
    resolver: zodResolver(verifySigninOtpSchema),
    defaultValues: {
      token: "",
      rememberMe: false,
    },
  });

  // Retrieve credentials from sessionStorage on component mount
  useEffect(() => {
    const storedCredentials = sessionStorage.getItem("tempLoginCredentials");
    if (storedCredentials) {
      try {
        const credentials = JSON.parse(storedCredentials) as TempCredentials;
        setTempCredentials(credentials);
      } catch (error) {
        console.error("Failed to parse stored credentials:", error);
        setErrorMessage("Invalid session. Please sign in again.");
      }
    } else {
      setErrorMessage("No login session found. Please sign in again.");
    }
  }, []);

  const verifySigninOTP = api.auth.verifySigninOTP.useMutation({
    onSuccess: async (result) => {
      if (result.success) {
        setErrorMessage(null);

        // Clean up stored credentials
        sessionStorage.removeItem("tempLoginCredentials");

        // Clean up any existing activity data
        localStorage.removeItem("userActivityData");
        localStorage.removeItem("auth_event_time");

        // Create a user session after successful login
        try {
          await createSession();
        } catch (error) {
          console.error("Failed to create session:", error);
          // Continue with login process even if session creation fails
        }

        // Get user role for redirection
        const userRole = result.user.user_metadata.role as string;

        // Role-based redirection
        const roleBasedRoute = userRole
          ? ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES]
          : "/";

        toast.success("Login successful");

        // Redirect to role-specific route
        router.push(roleBasedRoute);
        await utils.auth.getProfile.invalidate();
        router.refresh();
      } else {
        setErrorMessage("Verification failed");
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

  const sendOTP = api.auth.sendOTP.useMutation({
    onSuccess: (response) => {
      if (response.success) {
        setHasSentOnce(true);
        setTimeLeft(30);
        toast.success("OTP resent. Please check your email.");
      } else {
        toast.error("Failed to resend OTP", { description: response.message });
      }
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    },
  });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft]);

  const handleResend = () => {
    if (!tempCredentials) return;
    sendOTP.mutate({ email: tempCredentials.email });
  };

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
    if (!tempCredentials) {
      setErrorMessage("No login session found. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await verifySigninOTP.mutateAsync({
        email: tempCredentials.email,
        password: tempCredentials.password,
        token: data.token,
        rememberMe: data.rememberMe,
      });
    } catch (err) {
      // Error is handled in the mutation callbacks
      console.error("OTP verification error:", err);
    }
  };

  // Show error if no credentials found
  if (!tempCredentials) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Session Error
              </h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                <p>
                  {errorMessage ??
                    "No login session found. Please sign in again."}
                </p>
              </div>
            </div>
          </div>
        </div>
        <Button
          onClick={() => router.push("/login")}
          className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          Back to Sign In
        </Button>
      </div>
    );
  }

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

        {/* Resend OTP Button */}
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            onClick={handleResend}
            disabled={timeLeft > 0}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {timeLeft > 0
              ? `Resend OTP (${timeLeft}s)`
              : hasSentOnce
                ? "Resend OTP"
                : "Send OTP Again"}
          </Button>
        </div>
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center space-x-2">
        <input
          id="rememberMe"
          type="checkbox"
          checked={rememberMe}
          {...register("rememberMe")}
          onChange={(e) => {
            setRememberMe(e.target.checked);
            setValue("rememberMe", e.target.checked);
          }}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:checked:bg-blue-600"
        />
        <label
          htmlFor="rememberMe"
          className="text-sm text-gray-700 dark:text-gray-300"
        >
          Remember Me (keep me signed in for 1 month)
        </label>
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

export default SignInOtpForm;
