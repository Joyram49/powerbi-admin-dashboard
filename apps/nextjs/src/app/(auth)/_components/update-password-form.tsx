"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
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

// Password schema for validation
const formSchema = z
  .object({
    password: z
      .string()
      .min(12, { message: "Password must be within 12-20 characters" })
      .max(20, { message: "Password must be within 12-20 characters" })
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};:'"\\|,.<>/?]).+$/,
        {
          message:
            "Password must include at least one uppercase letter, one number, and one special character",
        },
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;
// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

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
};
export function UpdatePasswordForm() {
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const { data: userData } = api.auth.getProfile.useQuery();

  const userEmail = userData?.user.email;
  const utils = api.useUtils();
  const [formState, setFormState] = useState({
    isSubmitting: false,
    errorMessage: null as string | null,
  });
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const updatePassword = api.auth.updatePassword.useMutation({
    onSuccess: async (response) => {
      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        errorMessage: null,
      }));
      await utils.user.getAllUsers.invalidate();

      toast.success("Password Updated", {
        description:
          response.message || "Your password has been successfully updated.",
      });

      // Reset form after successful update
      form.reset();
      router.push("/login");
    },
    onError: (error) => {
      const errorMsg =
        error.message || "Something went wrong. Please try again.";

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
      await updatePassword.mutateAsync({
        password: data.password,
        email: userEmail!,
      });
    } catch (err) {
      // Error is handled in the mutation callbacks
      console.error(err);
    }
  };

  const togglePasswordVisibility = (field: "password" | "confirmPassword") => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

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
              <Lock className="mr-2 h-5 w-5" />
              Update Password
            </CardTitle>
          </motion.div>
        </CardHeader>

        <CardContent className="pt-6">
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
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {formState.errorMessage}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <motion.div variants={variants.item}>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Create a new password that is at least 12 characters long and
                  includes an uppercase letter, a number, and a special
                  character.
                </p>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword.password ? "text" : "password"}
                            placeholder="Enter new password"
                            {...field}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("password")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 transform"
                          >
                            {showPassword.password ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={variants.item}>
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={
                              showPassword.confirmPassword ? "text" : "password"
                            }
                            placeholder="Confirm new password"
                            {...field}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              togglePasswordVisibility("confirmPassword")
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 transform"
                          >
                            {showPassword.confirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div
                className="flex justify-end pt-2"
                variants={variants.item}
              >
                <Button
                  type="submit"
                  disabled={formState.isSubmitting}
                  className="w-full bg-blue-500 text-white hover:bg-blue-600"
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
                      Updating...
                    </div>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </motion.div>
            </motion.form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(12, { message: "Password must be within 12-20 characters" })
      .max(20, { message: "Password must be within 12-20 characters" })
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};:'"\\|,.<>/?]).+$/,
        {
          message:
            "Password must include at least one uppercase letter, one number, and one special character",
        },
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface PasswordUpdateModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Animation variants

export function PasswordUpdateModal({
  userId,
  isOpen,
  onClose,
  onSuccess,
}: PasswordUpdateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // reset user password for admin and super admin only
  const resetPasswordMutation = api.auth.resetUserPassword.useMutation({
    onSuccess: () => {
      toast.success("Success", {
        description: "Password updated successfully",
      });
      form.reset();
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to update password",
      });
      setIsSubmitting(false);
    },
  });

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: PasswordFormData) => {
    setIsSubmitting(true);
    resetPasswordMutation.mutate({
      userId,
      password: data.password,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="dark:border-gray-700 dark:bg-gray-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Update Password</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-medium dark:text-gray-300">
                        New Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter new password"
                          {...field}
                          className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-sm font-medium dark:text-gray-300">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          {...field}
                          className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                      </FormControl>
                      <FormMessage className="text-xs dark:text-red-400" />
                    </FormItem>
                  )}
                />
              </motion.div>

              <DialogFooter className="flex items-center justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="dark:border-gray-700 dark:text-gray-300"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </Button>
              </DialogFooter>
            </motion.div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// This is the update to your main form component to include the password update button
// Replace your existing password fields with this when in update mode
export function UserFormPasswordSection({
  isUpdateMode,
  userId,
  form,
  password,
}: {
  isUpdateMode: boolean;
  userId: string | undefined;
  form: any;
  password?: string;
}) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Only show password fields in create mode
  if (!isUpdateMode) {
    return (
      <>
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
                    placeholder="Enter password"
                    {...field}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </FormControl>
                <FormMessage className="text-xs dark:text-red-400" />
              </FormItem>
            )}
          />
        </motion.div>

        {(password && password.length > 0) || !isUpdateMode ? (
          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-sm font-medium dark:text-gray-300">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      {...field}
                      className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </FormControl>
                  <FormMessage className="text-xs dark:text-red-400" />
                </FormItem>
              )}
            />
          </motion.div>
        ) : null}
      </>
    );
  }

  // In update mode, show the change password button instead
  return (
    <>
      <motion.div variants={itemVariants}>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsPasswordModalOpen(true)}
          className="mt-2 w-full border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 sm:w-auto"
        >
          Change Password
        </Button>
      </motion.div>

      {isPasswordModalOpen && (
        <PasswordUpdateModal
          userId={userId!}
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}
    </>
  );
}
