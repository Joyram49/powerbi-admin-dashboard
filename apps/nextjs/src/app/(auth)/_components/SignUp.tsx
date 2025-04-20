"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";

// Form validation schema with improved password requirements
const FormSchema = z.object({
  userName: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" }),
  email: z
    .string({ message: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(12, { message: "Password must be at least 12 characters" })
    .max(20, { message: "Password must be less than 20 characters" })
    .regex(/^(?=.*[A-Z])/, {
      message: "Password must include at least one uppercase letter",
    })
    .regex(/^(?=.*[a-z])/, {
      message: "Password must include at least one lowercase letter",
    })
    .regex(/^(?=.*\d)/, {
      message: "Password must include at least one number",
    })
    .regex(/^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, {
      message:
        "Password must include at least one special character (!@#$%^&*()_+-=[]{}\\|;:'\",.<>/?)",
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
interface requestedDataType {
  role: "user" | "admin" | "superAdmin";
  userName: string;
  email: string;
  password: string;
  companyId?: string;
}
export function SignUpForm() {
  const [isSubmitting, _setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      userName: "",
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const router = useRouter();

  // Password strength calculator
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;

    let strength = 0;

    // Length check
    if (password.length >= 12) strength += 25;
    else if (password.length >= 8) strength += 15;
    else if (password.length >= 6) strength += 5;

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
        setPasswordStrength(calculatePasswordStrength(value.password ?? ""));
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const register = api.auth.signUp.useMutation();

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const requestedData: requestedDataType = {
      ...data,
      role: "superAdmin",
    };
    register.mutate(requestedData, {
      onError: (error) => {
        toast.error(`${error.message}`);
      },
      onSuccess: () => {
        toast.success(`Signup successful, Verify your email`);
        form.reset();
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
        router.refresh();
      },
    });
  }

  // Show password strength color
  const getStrengthColor = () => {
    if (passwordStrength < 30) return "#ef4444";
    if (passwordStrength < 60) return "#f97316";
    if (passwordStrength < 80) return "#eab308";
    return "#3b82f6";
  };

  // Get password strength label
  const getStrengthLabel = () => {
    if (passwordStrength < 30) return "Weak";
    if (passwordStrength < 60) return "Fair";
    if (passwordStrength < 80) return "Good";
    return "Strong";
  };

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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Sign Up
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
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="userName"
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
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        Username
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your username"
                          autoComplete="username"
                          aria-label="Username"
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
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="example@mail.com"
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
                          autoComplete="new-password"
                          aria-label="Password"
                          {...field}
                          className="bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </FormControl>
                      <div className="mt-2">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Password strength:
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              passwordStrength < 30
                                ? "text-red-500"
                                : passwordStrength < 60
                                  ? "text-orange-500"
                                  : passwordStrength < 80
                                    ? "text-yellow-500"
                                    : "text-green-500"
                            }`}
                          >
                            {getStrengthLabel()}
                          </span>
                        </div>
                        <Progress
                          value={passwordStrength}
                          className="mt-1 h-2"
                          style={
                            {
                              backgroundColor: "#e5e7eb",
                              "--progress-value": `${passwordStrength}%`,
                              "--progress-color": getStrengthColor(),
                            } as React.CSSProperties
                          }
                        />
                      </div>
                      <FormMessage className="text-xs dark:text-red-400" />
                      <div className="mt-2 text-xs text-gray-500">
                        Password must contain:
                        <ul className="mt-1 list-disc pl-5">
                          <li
                            className={
                              form.watch("password").length >= 12
                                ? "text-green-500"
                                : ""
                            }
                          >
                            At least 12 characters
                          </li>
                          <li
                            className={
                              /[A-Z]/.test(form.watch("password") || "")
                                ? "text-green-500"
                                : ""
                            }
                          >
                            At least one uppercase letter
                          </li>
                          <li
                            className={
                              /[a-z]/.test(form.watch("password") || "")
                                ? "text-green-500"
                                : ""
                            }
                          >
                            At least one lowercase letter
                          </li>
                          <li
                            className={
                              /\d/.test(form.watch("password") || "")
                                ? "text-green-500"
                                : ""
                            }
                          >
                            At least one number
                          </li>
                          <li
                            className={
                              /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
                                form.watch("password") || "",
                              )
                                ? "text-green-500"
                                : ""
                            }
                          >
                            At least one special character
                          </li>
                        </ul>
                      </div>
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
                    aria-label="Sign up button"
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
                        Signing Up...
                      </motion.div>
                    ) : (
                      <div className="flex items-center justify-center">
                        Sign Up
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
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                    )}
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{" "}
                  <Link
                    href="/signin"
                    className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Sign In
                  </Link>
                </p>
              </motion.div>
            </motion.form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
