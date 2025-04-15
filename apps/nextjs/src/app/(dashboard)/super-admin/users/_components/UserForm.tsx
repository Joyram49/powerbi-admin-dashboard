"use client";

import type { UseFormReturn } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { toast } from "@acme/ui/toast";

import { UserFormPasswordSection } from "~/app/(auth)/_components/UpdatePasswordForm";
import { api } from "~/trpc/react";

// Form schema that matches both our create and update API expectations
const userSchema = z
  .object({
    id: z.string(),
    userName: z
      .string()
      .min(2, "Username is required")
      .refine((val) => !val.includes(" "), "Username cannot contain spaces"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    email: z.string().email("Valid email is required"),
    role: z.enum(["user", "admin", "superAdmin"]).default("user"),
    companyId: z.string().uuid().optional(),
    sendWelcomeEmail: z.boolean().default(true),
    modifiedBy: z.string().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .refine(
    (data) => {
      // For new users (no id), password is required
      if (!data.id && (!data.password || data.password.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Password is required for new users",
      path: ["password"],
    },
  )
  .refine(
    (data) => {
      // If password is provided, validate it
      if (data.password && data.password.length > 0) {
        return data.password.length >= 12;
      }
      return true;
    },
    {
      message: "Password must be at least 12 characters",
      path: ["password"],
    },
  )
  .refine(
    (data) => {
      // If password is provided, validate it
      if (data.password && data.password.length > 0) {
        return /[A-Z]/.test(data.password);
      }
      return true;
    },
    {
      message: "Password must contain at least one uppercase letter",
      path: ["password"],
    },
  )
  .refine(
    (data) => {
      // If password is provided, validate it
      if (data.password && data.password.length > 0) {
        return /[a-z]/.test(data.password);
      }
      return true;
    },
    {
      message: "Password must contain at least one lowercase letter",
      path: ["password"],
    },
  )
  .refine(
    (data) => {
      // If password is provided, validate it
      if (data.password && data.password.length > 0) {
        return /[0-9]/.test(data.password);
      }
      return true;
    },
    {
      message: "Password must contain at least one number",
      path: ["password"],
    },
  )
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

// Define type for form values
type FormValues = z.infer<typeof userSchema>;

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

interface UserFormProps {
  onClose?: () => void;
  initialData?: User;
}
export function UserForm({ onClose, initialData }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const utils = api.useUtils();
  const { data: profileData } = api.auth.getProfile.useQuery();
  const currentUserId = profileData?.user?.id;
  const { data: companies } = api.company.getAllCompanies.useQuery();

  const userRole = profileData?.user?.user_metadata.role as string;

  // Create and update mutations
  const createUserMutation = api.auth.createUser.useMutation({
    onSuccess: async () => {
      toast.success("User added successfully");

      setIsSubmitting(false);
      await utils.user.getAllUsers.invalidate();
      await utils.user.getAdminUsers.invalidate();
      await utils.user.getAllGeneralUser.invalidate();
      if (onClose) onClose();
    },
    onError: (error) => {
      toast.error("Failed to add user", {
        description: error.message || "An error occurred",
      });
      setIsSubmitting(false);
    },
  });

  const updateUserMutation = api.user.updateUser.useMutation({
    onSuccess: async () => {
      toast.success("User updated successfully");
      setIsSubmitting(false);
      await utils.user.getAllUsers.invalidate();
      await utils.user.getAdminUsers.invalidate();
      await utils.user.getAllGeneralUser.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update user", {
        description: error.message || "An error occurred",
      });
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);

    if (values.id) {
      // Update flow
      const updateData = {
        userId: values.id,
        modifiedBy: currentUserId ?? "",
        role: values.role,
        status: values.status,
        companyId: values.companyId ?? undefined,
        userName: values.userName || undefined,
        password: values.password,
      };

      updateUserMutation.mutate(updateData);
    } else {
      // Create flow
      if (!values.password) {
        toast.error("Password is required for new users");
        setIsSubmitting(false);
        return;
      }

      const createData = {
        email: values.email,
        role: values.role,
        password: values.password,
        userName: values.userName,
        companyId: values.companyId ?? undefined,
        modifiedBy: currentUserId ?? "",
        status: values.status,
      };

      createUserMutation.mutate(createData);
    }
  };

  // Initialize form with default or user data
  const form = useForm<FormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: initialData?.userId ?? initialData?.id,
      userName: initialData?.userName,
      email: initialData?.email,
      role: initialData?.role,
      companyId: initialData?.companyId ?? "",
      password: "",
      confirmPassword: "",
      sendWelcomeEmail: true,
      status: initialData?.status ?? "active",
    },
    mode: "onChange",
  });

  // Reset form when initial data changes
  useEffect(() => {
    form.reset({
      id: initialData?.userId ?? initialData?.id,
      userName: initialData?.userName,
      email: initialData?.email,
      role: initialData?.role,
      companyId: initialData?.companyId ?? "",
      password: "",
      confirmPassword: "",
      sendWelcomeEmail: true,
      modifiedBy: currentUserId ?? undefined,
      status: initialData?.status ?? "active",
    });
  }, [initialData, form, currentUserId]);

  const role = form.watch("role");
  const password = form.watch("password");
  const isUpdateMode = !!initialData?.userId || !!initialData?.id;

  return (
    <Form {...form}>
      <motion.form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Username Field */}
        <motion.div variants={itemVariants}>
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center text-sm font-medium dark:text-gray-300">
                  Username
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter username"
                    {...field}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </FormControl>
                <FormMessage className="text-xs dark:text-red-400" />
              </FormItem>
            )}
          />
        </motion.div>

        {/* Email Field */}
        <motion.div variants={itemVariants}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center text-sm font-medium dark:text-gray-300">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter email"
                    {...field}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </FormControl>
                <FormMessage className="text-xs dark:text-red-400" />
              </FormItem>
            )}
          />
        </motion.div>

        {/* Password Fields (only for new users or when changing) */}
        {!isUpdateMode && (
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
          </>
        )}

        {/* Status Field */}
        <motion.div variants={itemVariants}>
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center text-sm font-medium dark:text-gray-300">
                  Status
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                      <SelectValue placeholder="Select user status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs dark:text-red-400" />
              </FormItem>
            )}
          />
        </motion.div>

        {/* Role Field */}
        <motion.div variants={itemVariants}>
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center text-sm font-medium dark:text-gray-300">
                  Role
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                      <SelectValue placeholder="Select user role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    {(userRole === "superAdmin" || userRole === "admin") && (
                      <>
                        <SelectItem value="admin">Admin</SelectItem>
                        {userRole === "superAdmin" && (
                          <SelectItem value="superAdmin">
                            Super Admin
                          </SelectItem>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs dark:text-red-400" />
              </FormItem>
            )}
          />
        </motion.div>

        {/* Company Field (for users) */}
        {role === "user" && companies?.data && companies.data.length > 0 && (
          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-sm font-medium dark:text-gray-300">
                    Company
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.data.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs dark:text-red-400" />
                </FormItem>
              )}
            />
          </motion.div>
        )}

        {/* Send Welcome Email Checkbox (for new users) */}
        {!isUpdateMode && (
          <motion.div variants={itemVariants} className="space-y-2">
            <FormField
              control={form.control}
              name="sendWelcomeEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-blue-600 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white dark:border-gray-600"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium dark:text-gray-300">
                      Send Welcome Email
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </motion.div>
        )}

        {/* Password Update Section for Existing Users */}
        {isUpdateMode && initialData.id && (
          <UserFormPasswordSection
            isUpdateMode={isUpdateMode}
            userId={initialData.id}
            form={
              form as unknown as UseFormReturn<{
                password: string;
                confirmPassword: string;
              }>
            }
            password={password}
          />
        )}

        {/* Submit Buttons */}
        <motion.div
          className="flex justify-end gap-3 pt-2"
          variants={itemVariants}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            className="border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center text-white">
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdateMode ? "Update" : "Save"}
                </div>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </motion.form>
    </Form>
  );
}
