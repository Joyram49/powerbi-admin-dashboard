"use client";

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
import { toast, Toaster } from "@acme/ui/toast";

import { api } from "~/trpc/react";
import { ROLE_ROUTES } from "~/utils/routes";

// Form validation schema with updated password requirements
const FormSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(12, { message: "Password must be between 12-20 characters" })
    .max(20, { message: "Password must be between 12-20 characters" })
    .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/, {
      message:
        "Password must include at least one uppercase letter, one number, and one special character",
    }),
});

// Animation variants (kept from previous version)
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
  const router = useRouter();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });
  const createOrUpdateSession = api.session.createOrUpdateSession.useMutation({
    onError: (error) => {
      console.error("Session creation failed:", error);
      // We don't show this error to the user as the login was successful
    },
    onSuccess: (result) => {
      console.log("Session created/updated:", result);
    },
  });
  const signIn = api.auth.signIn.useMutation({
    onError: (error) => {
      const errorMessage = error.message || "Login failed. Please try again.";
      toast.error(errorMessage);
    },
    onSuccess: (result) => {
      // result contains user role information
      const userRole = result.user.user_metadata.role as string;

      // Role-based redirection
      const roleBasedRoute = userRole
        ? ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES]
        : "/";

      toast.success("Login successful");
      form.reset();
      createOrUpdateSession.mutate();
      // Redirect to role-specific route
      router.push(roleBasedRoute);
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    signIn.mutate(data);
  }

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
              {/* Email Field */}
              <motion.div variants={itemVariants}>
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

              {/* Password Field */}
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-medium dark:text-gray-300">
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

              {/* Submit Button */}
              <motion.div variants={itemVariants} className="pt-4">
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    type="submit"
                    className="w-full bg-blue-500 px-6 py-3 text-base text-background hover:bg-blue-600 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                    disabled={signIn.isPending}
                    aria-label="Sign in button"
                  >
                    {signIn.isPending ? (
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

              {/* Sign Up Link */}
              <motion.div variants={itemVariants} className="pt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Can't remember password?
                  <Link
                    href="/forgot-password"
                    className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {""} Forgot password
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
