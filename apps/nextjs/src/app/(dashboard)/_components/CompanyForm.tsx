"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
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

// Form validation schemas
const formSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  companyAddress: z.string().min(2, "Company address is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactPhone: z
    .string()
    .min(10, "Valid phone number is required")
    .refine((val) => /^[0-9+\-\s()]*$/.test(val), "Invalid phone format"),
  contactEmail: z.string().email("Valid email is required"),
  usersAllowed: z.number().int().min(1, "At least 1 user required"),
  companyAdmin: z.string().optional(),
});

const adminFormSchema = z
  .object({
    username: z
      .string()
      .min(2, "Username is required")
      .refine((val) => !val.includes(" "), "Username cannot contain spaces"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(8, "Confirm your password"),
    email: z.string().email("Valid email is required"),
    fullName: z.string().min(2, "Full name is required"),
    adminType: z.string().min(1, "Admin type is required"),
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

const CompanyAdminForm = () => {
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formStep, setFormStep] = useState(0);

  // Handle hydration issues with theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Main form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      companyAddress: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      usersAllowed: 10,
      companyAdmin: "David Heitman",
    },
    mode: "onChange",
  });

  // Admin form
  const adminForm = useForm({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      fullName: "",
      adminType: "Company Administrator",
    },
    mode: "onChange",
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setFormSubmitted(true);
    console.log("Form submitted:", values);

    // Simulating API call
    setTimeout(() => {
      setFormSubmitted(false);
      toast.success("Company Added", {
        description: "New company has been successfully created.",
      });

      form.reset();
      setFormStep(0);
    }, 1500);
  };

  const onAdminSubmit = (values: z.infer<typeof adminFormSchema>) => {
    console.log("Admin form submitted:", values);
    setShowAdminForm(false);

    // Show success notification
    toast.success("Administrator Added", {
      description: `${values.fullName} has been added as ${values.adminType}.`,
    });

    // Update the company admin field in the main form
    form.setValue("companyAdmin", values.fullName);
  };

  const handleNextStep = async () => {
    const isValid = await form.trigger([
      "companyName",
      "companyAddress",
      "contactName",
    ]);

    if (isValid) {
      setFormStep(1);
    }
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <Card className="border bg-gray-100 dark:border-gray-800 dark:bg-gray-900">
        <CardHeader className="border-b bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CardTitle className="text-xl font-bold sm:text-2xl">
                {formStep === 0 ? "Add New Company" : "Contact Details"}
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

        <CardContent className="pt-6">
          <Form {...form}>
            <motion.form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {formStep === 0 && (
                <>
                  <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 gap-5 md:grid-cols-2"
                  >
                    <FormField
                      control={form.control}
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
                              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white bg-white"
                            />
                          </FormControl>
                          <FormMessage className="text-xs dark:text-red-400" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="usersAllowed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Users Allowed
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white bg-white"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                            Maximum number of user accounts
                          </FormDescription>
                          <FormMessage className="text-xs dark:text-red-400" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="companyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Company Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter full address"
                              {...field}
                              className="dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white"
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
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Primary Contact
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter contact person name"
                              {...field}
                              className="dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white"
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
                          className="ml-1"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Button>
                    </motion.div>
                  </motion.div>
                </>
              )}

              {formStep === 1 && (
                <>
                  <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 gap-5 md:grid-cols-2"
                  >
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Contact Phone
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter phone number"
                              {...field}
                              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </FormControl>
                          <FormMessage className="text-xs dark:text-red-400" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Contact Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter email address"
                              {...field}
                              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                      name="companyAdmin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Company Administrator
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                                <SelectValue placeholder="Select an administrator" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                              <SelectItem
                                value="David Heitman"
                                className="dark:text-white dark:focus:bg-gray-700"
                              >
                                David Heitman
                              </SelectItem>
                              <SelectItem
                                value="John Doe"
                                className="dark:text-white dark:focus:bg-gray-700"
                              >
                                John Doe
                              </SelectItem>
                              <SelectItem
                                value="Jane Smith"
                                className="dark:text-white dark:focus:bg-gray-700"
                              >
                                Jane Smith
                              </SelectItem>
                            </SelectContent>
                          </Select>
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
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <line x1="19" y1="8" x2="19" y2="14"></line>
                          <line x1="16" y1="11" x2="22" y2="11"></line>
                        </svg>
                        Add New Admin
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
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
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
                          disabled={formSubmitted}
                        >
                          {formSubmitted ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center"
                            >
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
                              Saving...
                            </motion.div>
                          ) : (
                            <>
                              Save Company
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
                                className="ml-1"
                              >
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                              </svg>
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
                  onSubmit={adminForm.handleSubmit(onAdminSubmit)}
                  className="space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                  >
                    <FormField
                      control={adminForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter full name"
                              {...field}
                              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </FormControl>
                          <FormMessage className="text-xs dark:text-red-400" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={adminForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Username
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Create username"
                              {...field}
                              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                              {...field}
                              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                              placeholder="Create password"
                              {...field}
                              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </FormControl>
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
                              placeholder="Confirm password"
                              {...field}
                              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                      name="adminType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Administrator Type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                                <SelectValue placeholder="Select admin type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="dark:border-gray-800 dark:bg-gray-900">
                              <SelectItem
                                value="Company Administrator"
                                className="dark:text-white dark:focus:bg-gray-700"
                              >
                                Company Administrator
                              </SelectItem>
                              <SelectItem
                                value="System Administrator"
                                className="dark:text-white dark:focus:bg-gray-700"
                              >
                                System Administrator
                              </SelectItem>
                              <SelectItem
                                value="Limited Administrator"
                                className="dark:text-white dark:focus:bg-gray-700"
                              >
                                Limited Administrator
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                            Determines permission level
                          </FormDescription>
                          <FormMessage className="text-xs dark:text-red-400" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    className="mt-4 flex justify-end gap-2"
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
                      >
                        Create Admin
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
