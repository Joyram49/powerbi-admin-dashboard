"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import type { Admins, CreateAdminFormValues } from "@acme/db/schema";
import { createAdminSchema } from "@acme/db/schema";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";

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

interface AdminCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdminCreated: (admin: Admins) => void;
}

const AdminCreationDialog = ({
  open,
  onOpenChange,
  onAdminCreated,
}: AdminCreationDialogProps) => {
  const [adminFormSubmitted, setAdminFormSubmitted] = useState(false);
  const utils = api.useUtils();

  // Admin form
  const adminForm = useForm({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "admin" as const,
    },
    mode: "onChange",
  });

  // Create admin user mutation
  const createAdminMutation = api.auth.createUser.useMutation({
    onSuccess: async (adminUser) => {
      toast.success("Administrator Created", {
        description: "New administrator has been successfully created.",
      });

      // Reset admin form and close the admin dialog
      setAdminFormSubmitted(false);
      adminForm.reset();
      onOpenChange(false);

      // Notify parent component about the new admin
      if (adminUser.user) {
        const user = adminUser.user as {
          id: string;
          email: string;
          user_metadata: { userName?: string };
        };
        const userName = user.user_metadata.userName ?? "anonymous";
        const admin: Admins = {
          id: user.id,
          userName,
          email: user.email,
        };
        onAdminCreated(admin);
      }

      // Refresh admin users list in the background
      await utils.user.getAdminUsers.invalidate();
    },
    onError: (error) => {
      setAdminFormSubmitted(false);
      toast.error("Administrator Creation Failed", {
        description: error.message || "Unable to create company administrator",
      });
    },
  });

  const onSubmitAdmin = (values: CreateAdminFormValues) => {
    setAdminFormSubmitted(true);

    // Create a new admin user
    createAdminMutation.mutate({
      userName: values.userName,
      email: values.email,
      password: values.password,
      role: "admin",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:border-gray-800 dark:bg-gray-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl dark:text-white">
            New Administrator
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Create a new administrator account
          </DialogDescription>
        </DialogHeader>

        <Form {...adminForm}>
          <motion.form
            onSubmit={adminForm.handleSubmit(onSubmitAdmin)}
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <FormField
                control={adminForm.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium dark:text-gray-300">
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Create username"
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
                control={adminForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium dark:text-gray-300">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter email address"
                        type="email"
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
              variants={itemVariants}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <FormField
                control={adminForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium dark:text-gray-300">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password..."
                        {...field}
                        className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                      Min 12 chars with uppercase, lowercase & number
                    </FormDescription>
                    <FormMessage className="text-xs dark:text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={adminForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium dark:text-gray-300">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password..."
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
              className="flex justify-end gap-2 pt-4"
              variants={itemVariants}
            >
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="bg-gray-100 text-gray-900 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </motion.div>

              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  type="submit"
                  className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  disabled={adminFormSubmitted}
                >
                  {adminFormSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center"
                    >
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </motion.div>
                  ) : (
                    "Create Admin"
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </motion.form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCreationDialog;
