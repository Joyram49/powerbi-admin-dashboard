"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  User,
} from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Separator } from "@acme/ui/separator";
import { toast, Toaster } from "@acme/ui/toast";

import { api } from "~/trpc/react";

const PHONE_NUMBER_REGEX =
  /^(?:(?:\+|00)?\d{1,4}[-.\s]?)?(?:\(?\d{1,4}\)?[-.\s]?)?[\d\s-]{6,20}$/;

// Form validation schemas
const companyFormSchema = z.object({
  companyName: z.string().min(3, "Company name must be at least 3 characters"),
  address: z.string(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) =>
        val === undefined || val.trim() === "" || PHONE_NUMBER_REGEX.test(val),
      "Invalid phone number format",
    ),
  email: z.string().email("Valid email is required"),
  adminId: z.string().optional(),
});

const adminFormSchema = z
  .object({
    userName: z
      .string()
      .min(2, "Username is required")
      .refine((val) => !val.includes(" "), "Username cannot contain spaces"),
    email: z.string().email("Valid email is required"),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z
      .string()
      .min(12, "Password must be at least 12 characters"),
    role: z.literal("admin"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
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

interface User {
  id: string;
  userName: string;
  email: string;
  role: string;
  status?: "active" | "inactive" | null;
}

interface AdminUser {
  id: string;
  userName: string;
}

interface Company {
  id: string;
  companyName: string;
  address: string;
  phone?: string;
  email: string;
  admin: AdminUser;
}

const CompanyAdminForm = ({
  onClose,
  initialData,
}: {
  onClose?: () => void;
  initialData?: Company;
}) => {
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [companyFormSubmitted, setCompanyFormSubmitted] = useState(false);
  const [adminFormSubmitted, setAdminFormSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [existingAdmins, setExistingAdmins] = useState<User[]>([]);

  const { data: admins } = api.user.getAdminUsers.useQuery();
  const utils = api.useUtils();

  useEffect(() => {
    if (admins) {
      setExistingAdmins(admins.data);
    }
  }, [admins]);

  // Handle hydration issues with theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Company form
  const companyForm = useForm({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      companyName: initialData?.companyName ?? "",
      address: initialData?.address ?? "",
      phone: initialData?.phone ?? "",
      email: initialData?.email ?? "",
      adminId: initialData?.admin.id ?? "",
    },
    mode: "onChange",
  });

  // Admin form
  const adminForm = useForm({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "admin" as const,
    },
    mode: "onChange",
  });

  // Update company mutation
  const updateCompanyMutation = api.company.updateCompany.useMutation({
    onSuccess: async (data) => {
      toast.success("Company Updated", {
        description: `${data.data?.companyName} has been successfully updated.`,
      });
      companyForm.reset();

      await utils.company.getAllCompanies.invalidate();
      if (onClose) onClose();
    },
    onError: (error) => {
      toast.error("Update Failed", {
        description: error.message || "Unable to update company",
      });
      setCompanyFormSubmitted(false);
    },
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
      setShowAdminForm(false);

      // Refresh admin users list
      await utils.user.getAdminUsers.invalidate();

      // Update the company form with the new admin ID
      if (adminUser.user?.id) {
        companyForm.setValue("adminId", adminUser.user.id);
      }
    },
    onError: (error) => {
      setAdminFormSubmitted(false);
      toast.error("Administrator Creation Failed", {
        description: error.message || "Unable to create company administrator",
      });
    },
  });

  // Removed unused updateAdminMutation

  // Create company mutation
  const createCompanyMutation = api.company.create.useMutation({
    onSuccess: async (data) => {
      setCompanyFormSubmitted(false);
      toast.success("Company Added", {
        description: `${data.company?.companyName} has been successfully created.`,
      });
      companyForm.reset();
      setFormStep(0);
      await utils.company.getAllCompanies.invalidate();
      if (onClose) setTimeout(onClose, 1500); // Close modal after showing success toast
    },
    onError: (error) => {
      setCompanyFormSubmitted(false);
      toast.error("Company Creation Failed", {
        description: error.message || "Unable to create company",
      });
    },
  });

  const onSubmitCompany = (values: z.infer<typeof companyFormSchema>) => {
    setCompanyFormSubmitted(true);

    try {
      if (initialData) {
        // Update existing company
        updateCompanyMutation.mutate({
          companyId: initialData.id,
          companyName: values.companyName,
          address: values.address,
          phone: values.phone,
          email: values.email,
        });
      } else {
        // For new company, we need admin information
        if (!values.adminId) {
          toast.error("Admin Selection Required", {
            description: "Please select an administrator for this company",
          });
          setCompanyFormSubmitted(false);
          return;
        }

        // Create company with selected admin
        createCompanyMutation.mutate({
          companyName: values.companyName,
          address: values.address,
          phone: values.phone,
          email: values.email,
          companyAdminId: values.adminId,
        });
      }
    } catch (error) {
      setCompanyFormSubmitted(false);
      toast.error("Submission Error", {
        description: "Failed to process company data",
      });
    }
  };

  const onSubmitAdmin = (values: z.infer<typeof adminFormSchema>) => {
    setAdminFormSubmitted(true);

    // Create a new admin user
    createAdminMutation.mutate({
      userName: values.userName,
      email: values.email,
      password: values.password,
      role: "admin",
    });
  };

  const handleNextStep = async () => {
    const isValid = await companyForm.trigger([
      "companyName",
      "email",
      "phone",
      "address",
    ]);

    if (isValid) {
      setFormStep(1);
    } else {
      console.log(companyForm.formState.errors); // Log validation errors for debugging
    }
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-4xl p-2 sm:p-4 md:p-6">
      <Card className="overflow-hidden border bg-gray-100 dark:border-gray-800 dark:bg-gray-900">
        <CardHeader className="border-b bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CardTitle className="text-xl font-bold sm:text-2xl">
                {initialData
                  ? "Edit Company"
                  : formStep === 0
                    ? "Add New Company"
                    : "Contact Details"}
              </CardTitle>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {formStep === 0
                  ? "Enter company information"
                  : "Complete contact information"}
              </p>
            </motion.div>

            <div className="hidden items-center sm:flex">
              <div
                className={`h-2 w-2 rounded-full ${formStep >= 0 ? "bg-blue-500" : "bg-gray-300"}`}
              ></div>
              <div
                className={`h-0.5 w-6 ${formStep >= 0 ? "bg-blue-500" : "bg-gray-300"}`}
              ></div>
              <div
                className={`h-2 w-2 rounded-full ${formStep >= 1 ? "bg-blue-500" : "bg-gray-300"}`}
              ></div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:pt-6">
          <Form {...companyForm}>
            <motion.form
              onSubmit={companyForm.handleSubmit(onSubmitCompany)}
              className="space-y-4 sm:space-y-5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {formStep === 0 && (
                <>
                  <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5"
                  >
                    <FormField
                      control={companyForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Company Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter company name"
                              {...field}
                              className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </FormControl>
                          <FormMessage className="text-xs dark:text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Company Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter full address"
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
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5"
                  >
                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter contact email"
                              type="email"
                              {...field}
                              className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </FormControl>
                          <FormMessage className="text-xs dark:text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter phone number"
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
                        type="button"
                        onClick={handleNextStep}
                        className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                      >
                        Continue
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                </>
              )}

              {formStep === 1 &&  (
                <>
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={companyForm.control}
                      name="adminId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Company Administrator
                          </FormLabel>
                          {existingAdmins.length > 0 ? (
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                                  <SelectValue placeholder="Select an administrator" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                                {existingAdmins.map((admin: User) => (
                                  <SelectItem
                                    key={admin.id}
                                    value={admin.id}
                                    className="dark:text-white dark:focus:bg-gray-700"
                                  >
                                    {admin.userName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="rounded-md bg-white p-3 text-sm dark:bg-gray-800 dark:text-gray-300">
                              No existing company administrators found. Please
                              create a new one.
                            </div>
                          )}
                          <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                            Select existing admin or create a new one
                          </FormDescription>
                          <FormMessage className="text-xs dark:text-red-400" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <Separator className="my-2 dark:bg-gray-800" />

                  <motion.div
                    className="flex flex-wrap justify-between gap-3 pt-2"
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
                        onClick={() => setShowAdminForm(true)}
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      >
                        <User className="mr-1 h-4 w-4" />
                        Add new admin
                      </Button>
                    </motion.div>

                    <div className="flex gap-2">
                      <motion.div
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFormStep(0)}
                          className="border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          Back
                        </Button>
                      </motion.div>

                      <motion.div
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Button
                          type="submit"
                          className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                          disabled={companyFormSubmitted}
                        >
                          {companyFormSubmitted ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center"
                            >
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </motion.div>
                          ) : (
                            <>
                              Save Company
                              <CheckCircle className="ml-1 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                </>
              )}
            </motion.form>
          </Form>
        </CardContent>
      </Card>

      {/* Admin Creation Dialog */}
      <AnimatePresence>
        {showAdminForm && (
          <Dialog open={showAdminForm} onOpenChange={setShowAdminForm}>
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
                        onClick={() => setShowAdminForm(false)}
                        className="border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
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
                        className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
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
        )}
      </AnimatePresence>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
};

export default CompanyAdminForm;
