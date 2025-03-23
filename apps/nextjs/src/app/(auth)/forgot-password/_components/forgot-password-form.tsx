"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
import { toast, Toaster } from "@acme/ui/toast";

import { api } from "~/trpc/react";

// Form validation schema
const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
});

type FormValues = z.infer<typeof formSchema>;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
};

const buttonVariants = {
  hover: { scale: 1.03, transition: { duration: 0.2 } },
  tap: { scale: 0.97 },
};

const successVariants = {
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
};

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasSentOnce, setHasSentOnce] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle hydration issues with theme
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeLeft]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  const sendOTP = api.auth.sendOTP.useMutation({
    onSuccess: (response) => {
      if (response.success) {
        setIsSuccess(true);
        setErrorMessage(null);
        setHasSentOnce(true);
        setTimeLeft(30); // Start 30-second timer
        toast.success("Password Reset Link Sent", {
          description: "Please check your email for further instructions.",
        });
      } else {
        setErrorMessage(response.message || "Failed to send reset link");
        toast.error("Error", {
          description: response.message || "Failed to send reset link",
        });
        setIsSubmitting(false);
      }
    },
    onError: (error) => {
      // Type-safe error handling
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      setErrorMessage(errorMsg);
      toast.error("Error", {
        description: errorMsg,
      });
      setIsSubmitting(false);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await sendOTP.mutateAsync({ email: data.email });
    } catch (err) {
      // Error is handled in the mutation callbacks
      console.log(err);
    }
  };

  const handleResend = () => {
    setIsSuccess(false);
    form.reset();
  };

  if (!mounted) return null;

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
          {isSuccess ? (
            <motion.div
              variants={successVariants}
              initial="hidden"
              animate="visible"
            >
              <Alert className="bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <svg
                  className="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <AlertTitle className="ml-2 text-base font-medium">
                  Reset link sent
                </AlertTitle>
                <AlertDescription className="mt-3">
                  <p className="text-sm">
                    We've sent a password reset link to your email address.
                    Please check your inbox and follow the instructions to reset
                    your password.
                  </p>

                  {timeLeft > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3 text-sm font-medium"
                    >
                      You can request another link in {timeLeft} seconds
                    </motion.p>
                  )}

                  {timeLeft === 0 && (
                    <motion.div
                      className="mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Button
                          onClick={handleResend}
                          className="inline-flex items-center bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-800/30 dark:text-green-400 dark:hover:bg-green-800/50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2"
                          >
                            <path d="M3 2v6h6"></path>
                            <path d="M3 8L9 2"></path>
                            <path d="M21 12A9 9 0 0 0 3 12"></path>
                          </svg>
                          Resend Link
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          ) : (
            <Form {...form}>
              <motion.form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert className="bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400">
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
                      <AlertTitle className="ml-2 text-base font-medium">
                        Error
                      </AlertTitle>
                      <AlertDescription className="ml-2 mt-2 text-sm">
                        {errorMessage}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <motion.div variants={itemVariants}>
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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2"
                          >
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                          </svg>
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
                  variants={itemVariants}
                >
                  <motion.div
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                      disabled={isSubmitting || timeLeft > 0}
                    >
                      {isSubmitting ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center"
                        >
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
                        </motion.div>
                      ) : (
                        <div className="flex items-center text-white">
                          {hasSentOnce ? "Resend Link" : "Send Reset Link"}
                          {timeLeft > 0 && ` (${timeLeft}s)`}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="ml-2"
                          >
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                          </svg>
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

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
