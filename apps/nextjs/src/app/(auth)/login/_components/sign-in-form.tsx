"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { Progress } from "@acme/ui/progress";
import { toast, Toaster } from "@acme/ui/toast";

import { api } from "~/trpc/react";

// Form validation schema with updated password requirements
const FormSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be between 8-20 characters" })
    .max(20, { message: "Password must be between 8-20 characters" })
    .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/, {
      message:
        "Password must include at least one uppercase letter, one number, and one special character",
    }),
});

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

export function SignInForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Handle hydration issues with theme
  useEffect(() => {
    setMounted(true);

    // Fetch CSRF token
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch("/api/csrf-token");
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (error) {
        console.error("Failed to fetch CSRF token:", error);
      }
    };

    fetchCsrfToken();
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  // Password strength calculator
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;

    let strength = 0;

    // Length check
    if (password.length >= 12) strength += 25;
    else if (password.length >= 8) strength += 15;

    // Character type checks
    if (/[A-Z]/.test(password)) strength += 25; // Uppercase
    if (/[a-z]/.test(password)) strength += 15; // Lowercase
    if (/[0-9]/.test(password)) strength += 15; // Numbers
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) strength += 20; // Special chars

    // Prevent exceeding 100%
    return Math.min(strength, 100);
  };

  // Update password strength when the password field changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "password" || name === undefined) {
        setPasswordStrength(calculatePasswordStrength(value.password || ""));
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  const router = useRouter();
  const signIn = api.auth.signIn.useMutation();

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsSubmitting(true);
    setErrorMessage(null);

    const requestedData = {
      ...data,
      _csrf: csrfToken,
    };

    signIn.mutate(requestedData, {
      onSuccess: (result) => {
        form.reset();
        toast.success("Sign In Successful", {
          description: "Redirecting to your dashboard...",
        });
        setTimeout(() => router.push("/dashboard"), 1000);
      },
      onError: (error) => {
        // Remove console.error for production
        const errorMsg =
          error instanceof Error
            ? error.message
            : "Invalid email or password. Please try again.";
        setErrorMessage(errorMsg);
        toast.error("Sign In Failed", {
          description: errorMsg,
        });
        setIsSubmitting(false);
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  }

  if (!mounted) return null;

  return (
    <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
      <Card className="w-full border bg-gray-100 dark:border-gray-800 dark:bg-gray-900">
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
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Sign In
            </CardTitle>
          </motion.div>
        </CardHeader>

        <CardContent className="px-6 py-8">
          <Form {...form}>
            <motion.form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Hidden CSRF token field */}
              {csrfToken && (
                <input type="hidden" name="_csrf" value={csrfToken} />
              )}

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
                      Sign In Failed
                    </AlertTitle>
                    <AlertDescription className="ml-2 mt-2 text-sm">
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
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
                          aria-label="Email address"
                          {...field}
                          className="bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </FormControl>
                      <FormMessage className="text-xs dark:text-red-400" />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="password"
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
                          <rect
                            width="18"
                            height="11"
                            x="3"
                            y="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          aria-label="Password"
                          {...field}
                          className="bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </FormControl>

                      <FormMessage className="text-xs dark:text-red-400" />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex items-center justify-between"
              >
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <motion.span
                    whileHover={{ x: 3 }}
                    className="flex items-center"
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
                      className="mr-1"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Forgot your password?
                  </motion.span>
                </Link>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-4">
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    type="submit"
                    className="w-full bg-blue-500 px-6 py-3 text-base text-background hover:bg-blue-600 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                    disabled={isSubmitting}
                    aria-label="Sign in button"
                  >
                    {isSubmitting ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center"
                      >
                        <svg
                          className="mr-2 h-4 w-4 animate-spin text-gray-900 dark:text-gray-900"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
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
                        Signing In...
                      </motion.div>
                    ) : (
                      <div className="flex items-center justify-center">
                        Sign In
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

              <motion.div variants={itemVariants} className="pt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{" "}
                  <Link
                    href="/register"
                    className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Sign Up
                  </Link>
                </p>
              </motion.div>
            </motion.form>
          </Form>
        </CardContent>
      </Card>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
