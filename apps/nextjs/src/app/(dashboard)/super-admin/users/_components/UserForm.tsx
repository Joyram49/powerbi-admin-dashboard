"use client";

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

import { UpdatePasswordForm } from "~/app/(auth)/_components/UpdatePasswordForm";
import { api } from "~/trpc/react";

// Form schema that matches both our create and update API expectations
const userSchema = z
  .object({
    id: z.string().optional(), // Make ID optional for new users
    userName: z
      .string()
      .min(2, "Username is required")
      .refine((val) => !val.includes(" "), "Username cannot contain spaces"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    email: z.string().email("Valid email is required"),
    role: z.enum(["superAdmin", "admin", "user"], {
      required_error: "Role is required",
    }),
    companyId: z.string().uuid().optional(),
    sendWelcomeEmail: z.boolean().default(true),
    modifiedBy: z.string().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .refine(
    (data) => {
      // For new users (no id or empty id), password is required
      if (
        (!data.id || data.id.trim() === "") &&
        (!data.password || data.password.length === 0)
      ) {
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
      // If password is provided, validate special characters
      if (data.password && data.password.length > 0) {
        return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(data.password);
      }
      return true;
    },
    {
      message: "Password must contain at least one special character",
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
  )
  .refine(
    (data) => {
      // Company ID is required if role is "user"
      if (data.role === "user") {
        return !!data.companyId && data.companyId.trim() !== "";
      }
      return true;
    },
    {
      message: "Company is required for users",
      path: ["companyId"],
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
  setDialogOpen?: (open: boolean) => void;
  initialData?: User;
  companyId?: string;
}

export function UserForm({ onClose, initialData, companyId }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data: profileData } = api.auth.getProfile.useQuery();
  const currentUserId = profileData?.user?.id;
  const userRole = profileData?.user?.user_metadata.role as string;

  // Fetch companies based on user role
  const { data: companies } =
    userRole === "admin"
      ? api.company.getCompaniesByAdminId.useQuery({
          companyAdminId: currentUserId ?? "",
        })
      : api.company.getAllCompanies.useQuery({ limit: 20 });

  // Create and update mutations
  const createUserMutation = api.auth.createUser.useMutation({
    onSuccess: async () => {
      toast.success("User added successfully");
      setIsSubmitting(false);
      setFormSubmitError(null);
      await utils.user.getAllUsers.invalidate();
      await utils.user.getAdminUsers.invalidate();
      await utils.user.getAllGeneralUser.invalidate();
      await utils.user.getUsersByCompanyId.invalidate();
      await utils.user.getUsersByAdminId.invalidate();
      if (onClose) onClose();
    },
    onError: (error) => {
      console.error("Create user error:", error);
      setFormSubmitError(error.message);
      toast.error("Failed to add user", {
        description: error.message || "An error occurred",
      });
      // setIsSubmitting(false);
    },
  });

  const updateUserMutation = api.user.updateUser.useMutation({
    onSuccess: async () => {
      toast.success("User updated successfully");
      setIsSubmitting(false);
      setFormSubmitError(null);
      await utils.user.getAllUsers.invalidate();
      await utils.user.getAdminUsers.invalidate();
      await utils.user.getAllGeneralUser.invalidate();
      await utils.user.getUsersByCompanyId.invalidate();
      await utils.user.getUsersByReportId.invalidate();
      if (initialData?.role === "admin") {
        await utils.user.getUsersByAdminId.invalidate();
      }
      if (onClose) onClose();
    },
    onError: (error) => {
      console.error("Update user error:", error);
      setFormSubmitError(error.message);
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
      id: initialData?.id ?? "",
      userName: initialData?.userName ?? "",
      password: "",
      confirmPassword: "",
      email: initialData?.email ?? "",
      role: initialData?.role ?? "user",
      companyId: initialData?.companyId ?? companyId ?? "",
      sendWelcomeEmail: true,
      status: initialData?.status ?? "active",
    },
    mode: "onChange",
  });

  // Reset form when initial data changes
  useEffect(() => {
    if (initialData) {
      const role = initialData.role;
      form.reset({
        id: initialData.id,
        userName: initialData.userName,
        email: initialData.email,
        role: initialData.role,
        companyId:
          role === "user"
            ? (initialData.companyId ?? companyId ?? "")
            : undefined,
        password: "",
        confirmPassword: "",
        sendWelcomeEmail: true,
        status: initialData.status ?? "active",
      });
    } else {
      form.reset({
        id: "",
        userName: "",
        email: "",
        role: "user",
        companyId: companyId ?? "",
        password: "",
        confirmPassword: "",
        sendWelcomeEmail: true,
        status: "active",
      });
    }
    setFormSubmitError(null);
  }, [initialData, form, companyId]);

  // Validate password meets all requirements
  const validatePassword = (password: string): boolean => {
    if (!password || password.length < 12) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return false;
    return true;
  };

  // Handle form submission with improved error handling
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    setFormSubmitError(null);
    console.log("Form submitted with values:", values);

    // Check if we're updating or creating
    const isUpdateMode = values.id && values.id.trim() !== "";

    if (isUpdateMode) {
      // Update flow
      if (values.password && !validatePassword(values.password)) {
        setFormSubmitError(
          "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
        );
        setIsSubmitting(false);
        return;
      }

      const updateData = {
        userId: values.id ?? "",
        modifiedBy: currentUserId ?? "",
        role: values.role,
        status: values.status ?? "active",
        companyId: values.companyId,
        userName: values.userName,
        password: values.password,
        prevCompanyId: initialData?.companyId ?? undefined,
      };

      console.log("Updating user:", updateData);
      updateUserMutation.mutate(updateData);
    } else {
      // Create flow
      if (!values.password) {
        setFormSubmitError("Password is required for new users");
        setIsSubmitting(false);
        return;
      }

      // Verify password meets all requirements
      if (!validatePassword(values.password)) {
        setFormSubmitError(
          "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
        );
        setIsSubmitting(false);
        return;
      }

      // Verify company ID for user role
      if (
        values.role === "user" &&
        (!values.companyId || values.companyId.trim() === "")
      ) {
        setFormSubmitError("Company is required for users");
        setIsSubmitting(false);
        return;
      }

      const createData = {
        email: values.email,
        role: values.role,
        password: values.password,
        userName: values.userName,
        companyId: values.role === "user" ? values.companyId : undefined,
        modifiedBy: currentUserId ?? "",
        status: values.status ?? "active",
        sendWelcomeEmail: values.sendWelcomeEmail,
      };

      createUserMutation.mutate(createData);
    }
  };

  const role = form.watch("role");
  const isUpdateMode = !!initialData?.id;
  useEffect(() => {
    if (role !== "user") {
      form.setValue("companyId", undefined);
    }
  }, [role, form]);
  const handlePasswordUpdateSuccess = () => {
    setIsPasswordModalOpen(false);
    toast.success("Password updated successfully");
  };

  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
  };

  return (
    <Form {...form}>
      <motion.div
        className="max-h-[70vh] overflow-y-auto pr-1 dark:bg-gray-900"
        style={{
          scrollbarWidth: "none" /* Firefox */,
          msOverflowStyle: "none" /* IE and Edge */,
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}</style>
        <motion.form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Error display if form submission fails */}
          {formSubmitError && (
            <motion.div
              variants={itemVariants}
              className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400"
            >
              <p className="font-medium">Error: {formSubmitError}</p>
            </motion.div>
          )}

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
                      disabled={isUpdateMode}
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Min. 12 characters with uppercase, lowercase, numbers
                        and special characters (!@#$%^&*)
                      </p>
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
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                        <SelectValue placeholder="Select user status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      <SelectItem
                        value="active"
                        className="dark:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                      >
                        Active
                      </SelectItem>
                      <SelectItem
                        value="inactive"
                        className="dark:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                      >
                        Inactive
                      </SelectItem>
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset company selection if changing to admin/superAdmin
                      if (value === "admin" || value === "superAdmin") {
                        form.setValue("companyId", "");
                      }
                    }}
                    value={field.value}
                    disabled={isUpdateMode} // Only disable in update mode
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                        <SelectValue placeholder="Select user role">
                          <span className="capitalize">{field.value}</span>
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      {userRole === "superAdmin" && (
                        <>
                          <SelectItem
                            value="superAdmin"
                            className="dark:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                          >
                            Super Admin
                          </SelectItem>
                          <SelectItem
                            value="admin"
                            className="dark:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                          >
                            Admin
                          </SelectItem>
                        </>
                      )}
                      <SelectItem
                        value="user"
                        className="dark:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                      >
                        User
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs dark:text-red-400" />
                </FormItem>
              )}
            />
          </motion.div>

          {/* Company Field (for users) */}
          {role === "user" && (
            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm font-medium dark:text-gray-300">
                      Company <span className="ml-1 text-red-500">*</span>
                    </FormLabel>
                    {companies?.data && companies.data.length > 0 ? (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:border-gray-700 dark:bg-gray-800">
                          {companies.data.map((company) => (
                            <SelectItem
                              key={company.id}
                              value={company.id}
                              className="dark:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                            >
                              {company.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-600 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        No companies available. Please create a company first.
                      </div>
                    )}
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
                        className="border-blue-600 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white dark:border-gray-600 dark:data-[state=checked]:bg-blue-600"
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
            <motion.div variants={itemVariants}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              >
                Reset Password
              </Button>
            </motion.div>
          )}

          {/* Submit Buttons */}
          <motion.div
            className="flex justify-end gap-3 pt-2"
            variants={itemVariants}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose?.();
              }}
              className="border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
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
      </motion.div>

      {/* Password Update Modal */}
      {isUpdateMode && initialData.id && (
        <UpdatePasswordForm
          isModal
          isOpen={isPasswordModalOpen}
          onClose={handlePasswordModalClose}
          userId={initialData.id}
          onSuccess={handlePasswordUpdateSuccess}
        />
      )}
    </Form>
  );
}
