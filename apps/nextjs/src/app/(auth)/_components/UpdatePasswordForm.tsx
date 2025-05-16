"use client";

import type { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useForm } from "react-hook-form";

import { updatePasswordSchemaFrontend } from "@acme/db/schema";
import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
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

type FormValues = z.infer<typeof updatePasswordSchemaFrontend>;

interface UpdatePasswordProps {
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  userId?: string;
}

// Animation Variants
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
};

// Components
const PasswordInput = ({
  field,
  showPassword,
  togglePassword,
  label,
  placeholder,
}: {
  field: React.ComponentProps<typeof Input>;
  showPassword: boolean;
  togglePassword: () => void;
  label: string;
  placeholder: string;
}) => (
  <FormItem>
    <FormLabel className="dark:text-gray-300">{label}</FormLabel>
    <FormControl>
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          {...field}
          className="bg-white pr-10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 transform"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          )}
        </button>
      </div>
    </FormControl>
    <FormMessage className="dark:text-red-400" />
  </FormItem>
);

const LoadingSpinner = () => (
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
);

const ErrorAlert = ({ message }: { message: string }) => (
  <Alert
    variant="destructive"
    className="dark:border-red-800 dark:bg-red-900/30"
  >
    <AlertTitle className="dark:text-red-300">Error</AlertTitle>
    <AlertDescription className="dark:text-red-300">{message}</AlertDescription>
  </Alert>
);

// Main Component
export function UpdatePasswordForm({
  isModal = false,
  isOpen,
  onClose,
  onSuccess,
  userId,
}: UpdatePasswordProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [formState, setFormState] = useState({
    isSubmitting: false,
    errorMessage: null as string | null,
  });

  const utils = api.useUtils();
  const form = useForm<FormValues>({
    resolver: zodResolver(updatePasswordSchemaFrontend),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  // Use the appropriate mutation based on context
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

      form.reset();
      if (isModal && onClose) {
        onClose();
      } else {
        router.push("/login");
      }
      if (onSuccess) onSuccess();
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

  const resetUserPassword = api.auth.resetUserPassword.useMutation({
    onSuccess: async (response) => {
      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        errorMessage: null,
      }));
      await utils.user.getAllUsers.invalidate();

      toast.success("Password Reset", {
        description:
          response.message || "Password has been successfully reset.",
      });

      form.reset();
      if (onClose) onClose();
      if (onSuccess) onSuccess();
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
      if (isModal && userId) {
        // Admin resetting another user's password
        await resetUserPassword.mutateAsync({
          userId,
          password: data.password,
        });
      } else {
        // User updating their own password
        await updatePassword.mutateAsync({
          password: data.password,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePasswordVisibility = (field: "password" | "confirmPassword") => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const formContent = (
    <Form {...form}>
      <motion.form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        variants={variants.container}
        initial="hidden"
        animate="visible"
      >
        {formState.errorMessage && (
          <ErrorAlert message={formState.errorMessage} />
        )}

        <motion.div variants={variants.item}>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Create a new password that is at least 12 characters long and
            includes an uppercase letter, a number, and a special character.
          </p>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <PasswordInput
                field={field}
                showPassword={showPassword.password}
                togglePassword={() => togglePasswordVisibility("password")}
                label="New Password"
                placeholder="Enter new password"
              />
            )}
          />
        </motion.div>

        <motion.div variants={variants.item}>
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <PasswordInput
                field={field}
                showPassword={showPassword.confirmPassword}
                togglePassword={() =>
                  togglePasswordVisibility("confirmPassword")
                }
                label="Confirm New Password"
                placeholder="Confirm new password"
              />
            )}
          />
        </motion.div>

        <motion.div
          className="flex justify-end gap-2 pt-2"
          variants={variants.item}
        >
          {isModal && onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={formState.isSubmitting}
              className="border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={formState.isSubmitting}
            className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {formState.isSubmitting ? <LoadingSpinner /> : "Update Password"}
          </Button>
        </motion.div>
      </motion.form>
    </Form>
  );

  if (isModal) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <DialogContent className="dark:border-gray-800 dark:bg-gray-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center dark:text-white">
              <Lock className="mr-2 h-5 w-5" />
              Reset User Password
            </DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

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

        <CardContent className="pt-6">{formContent}</CardContent>
      </Card>
    </div>
  );
}
