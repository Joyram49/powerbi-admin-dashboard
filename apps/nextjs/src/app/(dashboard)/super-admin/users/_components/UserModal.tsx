"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { toast } from "@acme/ui/toast";

import { UserFormPasswordSection } from "~/app/(auth)/_components/update-password-form";
import { api } from "~/trpc/react";

// Define User type to match what's expected across components
export interface User {
  id?: string;
  userId: string;
  userName: string;
  status?: "active" | "inactive";
  email: string;
  role: "user" | "admin" | "superAdmin";
  companyId?: string;
  modifiedBy?: string | null;
  dateCreated: Date;
  lastLogin: Date | null;
  company?: { companyName: string };
}

// Form schema that matches both our create and update API expectations
const userSchema = z
  .object({
    id: z.string().optional(),
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

interface UserModalProps {
  user?: Partial<User>;
  children?: React.ReactNode;
}

const UserModal: React.FC<UserModalProps> = ({ user, children }) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const utils = api.useUtils();

  // When we create user we need companyId.for instance we need to fetch all company
  const { data: companies } = api.company.getAllCompanies.useQuery();

  // Get current user profile
  const { data: profileData } = api.auth.getProfile.useQuery();
  const userRole = profileData?.user.user_metadata.role as string;
  const currentUserId = profileData?.user.id;

  // Create and update mutations
  const createUserMutation = api.auth.createUser.useMutation({
    onSuccess: async () => {
      toast.success("User added successfully");
      setOpen(false);
      setIsSubmitting(false);
      // Invalidate all user queries to refresh data
      await utils.user.getAllUsers.invalidate();
      await utils.user.getAdminUsers.invalidate();
      await utils.user.getAllGeneralUser.invalidate();
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
      setOpen(false);
      setIsSubmitting(false);
      // Invalidate all user queries to refresh data
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

  // Initialize form with default or user data
  const form = useForm<FormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: user?.userId ?? user?.id,
      userName: user?.userName ?? "",
      email: user?.email ?? "",
      role: user?.role ?? "user",
      companyId: user?.companyId,
      password: "",
      confirmPassword: "",
      sendWelcomeEmail: true,
      modifiedBy: currentUserId ?? undefined,
      status: user?.status,
    },
    mode: "onChange",
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);

    // Prepare data for API call
    const { ...restValues } = values;

    if (restValues.id) {
      // Update flow - Include ONLY the fields expected by the API
      const updateData = {
        userId: restValues.id,
        modifiedBy: currentUserId ?? "",
        role: restValues.role,
        status: restValues.status,
        companyId: restValues.companyId ?? undefined, // Ensure undefined instead of empty string
        userName: restValues.userName || undefined, // Ensure undefined instead of empty string
      };

      // Send ONLY fields defined in the API schema
      updateUserMutation.mutate(updateData);
    } else {
      // Create flow
      if (!restValues.password) {
        toast.error("Password is required for new users");
        setIsSubmitting(false);
        return;
      }

      const createData = {
        email: restValues.email,
        role: restValues.role,
        password: restValues.password,
        userName: restValues.userName,
        companyId: restValues.companyId ?? undefined,
        modifiedBy: currentUserId ?? "",
        status: restValues.status,
      };

      createUserMutation.mutate(createData);
    }
  };
  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        id: user?.userId ?? user?.id,
        userName: user?.userName ?? "",
        email: user?.email ?? "",
        role: user?.role ?? "user",
        companyId: user?.companyId,
        password: "",
        confirmPassword: "",
        sendWelcomeEmail: true,
        modifiedBy: currentUserId ?? undefined,
        status: user?.status,
      });
    }
  }, [open, user, form, currentUserId]);

  const role = form.watch("role");
  const password = form.watch("password");
  const isUpdateMode = !!user?.userId || !!user?.id;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
            {user ? "Edit User" : "Add User"}
          </Button>
        )}
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="bg-black/50" />
        <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-0 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:max-w-lg">
          <Card className="border-none shadow-none">
            <CardHeader className="relative border-b bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <CardTitle className="flex items-center text-xl font-bold sm:text-2xl">
                  {user ? "Edit User" : "Add New User"}
                </CardTitle>
              </motion.div>
            </CardHeader>

            <CardContent className="pt-6">
              <Form {...form}>
                <motion.form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
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
                  {!isUpdateMode && (
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
                  )}

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
                              {(userRole === "superAdmin" ||
                                userRole === "admin") && (
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

                  {role === "user" &&
                    companies?.data &&
                    companies.data.length > 0 && (
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
                                    <SelectItem
                                      key={company.id}
                                      value={company.id}
                                    >
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
                  {isUpdateMode && user.id && (
                    <UserFormPasswordSection
                      isUpdateMode={isUpdateMode}
                      userId={user.id}
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
                      form={form as any}
                      password={password}
                    />
                  )}
                  <motion.div
                    className="flex justify-end gap-3 pt-2"
                    variants={itemVariants}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
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
            </CardContent>
          </Card>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default UserModal;
