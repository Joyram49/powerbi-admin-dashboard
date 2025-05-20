"use client";

import type * as z from "zod";
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";

import { authRouterSchema } from "@acme/db/schema";
import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";

// Reusable animation variants
const variants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.05,
      },
    },
  },
  item: {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 400, damping: 30 },
    },
  },
  button: {
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97 },
  },
  success: {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
  },
};

type FormValues = z.infer<typeof authRouterSchema.sendOTP>;

export function ForgotPasswordForm() {
  const [formState, setFormState] = useState({
    isSubmitting: false,
    isSuccess: false,
    errorMessage: null as string | null,
    timeLeft: 0,
    hasSentOnce: false,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(authRouterSchema.sendOTP),
    defaultValues: { email: "" },
    mode: "onChange",
  });

  const sendOTP = api.auth.sendOTP.useMutation({
    onSuccess: (response) => {
      if (response.success) {
        setFormState((prev) => ({
          ...prev,
          isSuccess: true,
          errorMessage: null,
          hasSentOnce: true,
          timeLeft: 30,
          isSubmitting: false,
        }));

        toast.success("Password Reset Link Sent", {
          description: "Please check your email for further instructions.",
        });
      } else {
        setFormState((prev) => ({
          ...prev,
          errorMessage: response.message || "Failed to send reset link",
          isSubmitting: false,
        }));

        toast.error("Error", {
          description: response.message || "Failed to send reset link",
        });
      }
    },
    onError: (error) => {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      setFormState((prev) => ({
        ...prev,
        errorMessage: errorMsg,
        isSubmitting: false,
      }));

      toast.error("Error", { description: errorMsg });
    },
  });

  const onSubmit = async (data: FormValues) => {
    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      errorMessage: null,
    }));

    try {
      await sendOTP.mutateAsync({ email: data.email });
    } catch (err) {
      // Error is handled in the mutation callbacks
      console.error(err);
    }
  };

  const handleResend = () => {
    setFormState((prev) => ({
      ...prev,
      isSuccess: false,
    }));
    form.reset();
  };

  // Use a useEffect for countdown if needed
  React.useEffect(() => {
    if (formState.timeLeft <= 0) return;

    const timerId = setTimeout(() => {
      setFormState((prev) => ({
        ...prev,
        timeLeft: prev.timeLeft - 1,
      }));
    }, 1000);

    return () => clearTimeout(timerId);
  }, [formState.timeLeft]);

  return (
    <div className="mx-auto max-w-md p-4 md:p-6">
      <Card className="border bg-gray-100 dark:border-gray-800 dark:bg-gray-900">
        <CardHeader className="border-b bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CardTitle className="flex items-center text-xl font-bold sm:text-2xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Reset Password
            </CardTitle>
          </motion.div>
        </CardHeader>

        <CardContent className="pt-6">
          {formState.isSuccess ? (
            <motion.div
              variants={variants.success}
              initial="hidden"
              animate="visible"
            >
              <Alert className="bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                {/* Success Alert Content (unchanged) */}
                {formState.timeLeft > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 text-sm font-medium"
                  >
                    You can request another link in {formState.timeLeft} seconds
                  </motion.p>
                )}

                {formState.timeLeft === 0 && (
                  <motion.div
                    className="mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.div
                      variants={variants.button}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        onClick={handleResend}
                        className="inline-flex items-center bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-800/30 dark:text-green-400 dark:hover:bg-green-800/50"
                      >
                        Resend Link
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </Alert>
            </motion.div>
          ) : (
            <Form {...form}>
              <motion.form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                variants={variants.container}
                initial="hidden"
                animate="visible"
              >
                {formState.errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert className="bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      <AlertTitle className="ml-2 text-base font-medium">
                        Error
                      </AlertTitle>
                      <AlertDescription className="ml-2 mt-2 text-sm">
                        {formState.errorMessage}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <motion.div variants={variants.item}>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Enter your email address below and we'll send you a link to
                    reset your password.
                  </p>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-sm font-medium dark:text-gray-300">
                          Email address
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            {...field}
                            className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </FormControl>
                        <FormMessage className="text-xs dark:text-red-400" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  className="flex justify-end pt-2"
                  variants={variants.item}
                >
                  <motion.div
                    variants={variants.button}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                      disabled={
                        formState.isSubmitting || formState.timeLeft > 0
                      }
                    >
                      {formState.isSubmitting ? (
                        <div className="flex items-center">
                          <svg
                            className="mr-2 h-4 w-4 animate-spin text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Sending...
                        </div>
                      ) : (
                        <div className="flex items-center text-white">
                          {formState.hasSentOnce
                            ? "Resend Link"
                            : "Send Reset Link"}
                          {formState.timeLeft > 0 &&
                            ` (${formState.timeLeft}s)`}
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
