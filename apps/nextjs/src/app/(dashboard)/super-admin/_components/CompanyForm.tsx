"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
} from "lucide-react";
import { useForm } from "react-hook-form";

import type {
  Admins,
  CompanyFormValues,
  CompanyWithAdmins,
} from "@acme/db/schema";
import { createCompanySchema, updateCompanySchema } from "@acme/db/schema";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
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
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";
import { MultiSelect } from "../../_components/MultiSelect";
import AdminCreationDialog from "./CompanyAdminForm";

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

interface CompanyFormProps {
  onClose: (shouldRefresh?: boolean) => void;
  setDialogOpen?: (open: boolean) => void;
  initialData?: CompanyWithAdmins;
}

const CompanyForm = ({ onClose, initialData }: CompanyFormProps) => {
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [companyFormSubmitted, setCompanyFormSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [selectedAdmins, setSelectedAdmins] = useState<Admins[]>([]);
  const [isOldCompany, setIsOldCompany] = useState(false);

  const { data: admins, isLoading: adminsLoading } =
    api.user.getAdminUsers.useQuery(
      {
        limit: 100,
      },
      {
        enabled: true,
        refetchOnWindowFocus: false,
      },
    );

  const utils = api.useUtils();

  // Company form
  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(
      initialData ? updateCompanySchema : createCompanySchema,
    ),
    defaultValues: initialData
      ? {
          companyId: initialData.id,
          companyName: initialData.companyName,
          address: initialData.address ?? "",
          phone: initialData.phone ?? "",
          email: initialData.email ?? "",
          adminIds: initialData.admins.map((admin) => admin.id),
          preferredSubscriptionPlan:
            initialData.preferredSubscriptionPlan ?? null,
        }
      : {
          companyName: "",
          address: "",
          phone: "",
          email: "",
          adminIds: [],
          preferredSubscriptionPlan: null,
        },
    mode: "onChange",
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      companyForm.reset({
        companyId: initialData.id,
        companyName: initialData.companyName,
        address: initialData.address ?? "",
        phone: initialData.phone ?? "",
        email: initialData.email ?? "",
        adminIds: initialData.admins.map((admin) => admin.id),
        preferredSubscriptionPlan:
          initialData.preferredSubscriptionPlan ?? null,
      });
      setSelectedAdmins([...initialData.admins]);
    }
  }, [initialData, companyForm]);

  // Handle hydration issues with theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update company mutation
  const updateCompanyMutation = api.company.updateCompany.useMutation({
    onSuccess: async (data) => {
      toast.success("Company Updated", {
        description: `${data.data?.companyName} has been successfully updated.`,
      });
      companyForm.reset();

      await utils.company.getAllCompanies.invalidate();
      onClose();
    },
    onError: (error) => {
      toast.error("Update Failed", {
        description: error.message || "Unable to update company",
      });
      setCompanyFormSubmitted(false);
    },
  });

  // Create company mutation
  const createCompanyMutation = api.company.create.useMutation({
    onSuccess: async (data) => {
      setCompanyFormSubmitted(false);
      toast.success("Company Added", {
        description: `${data.company.companyName} has been successfully created.`,
      });
      companyForm.reset();
      setFormStep(0);
      await utils.company.getAllCompanies.invalidate();
      onClose();
    },
    onError: (error) => {
      setCompanyFormSubmitted(false);
      toast.error("Company Creation Failed", {
        description: error.message || "Unable to create company",
      });
    },
  });

  const onSubmitCompany = (values: CompanyFormValues) => {
    setCompanyFormSubmitted(true);

    try {
      if (initialData) {
        console.log("formData", values);
        // Update existing company
        updateCompanyMutation.mutate({
          companyId: initialData.id,
          companyName: values.companyName,
          address: values.address,
          phone: values.phone,
          email: values.email,
          adminIds: values.adminIds,
          preferredSubscriptionPlan: values.preferredSubscriptionPlan,
        });
      } else {
        // For new company, we need admin information
        if (!selectedAdmins.length) {
          toast.error("Admin Selection Required", {
            description: "Please select an administrator for this company",
          });
          setCompanyFormSubmitted(false);
          return;
        }

        const selectedAdminIds = selectedAdmins.map((admin) => admin.id);

        // Create company with selected admin
        createCompanyMutation.mutate({
          companyName: values.companyName,
          address: values.address,
          phone: values.phone,
          email: values.email,
          adminIds: selectedAdminIds,
          preferredSubscriptionPlan: isOldCompany
            ? values.preferredSubscriptionPlan
            : "data_foundation",
        });
      }
    } catch (error) {
      setCompanyFormSubmitted(false);
      toast.error("Submission Error", {
        description: `Failed to process company data: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
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
    }
  };

  const handleAdminCreated = async (admin: Admins) => {
    setSelectedAdmins([...selectedAdmins, admin]);
    companyForm.setValue("adminIds", [
      ...selectedAdmins.map((a) => a.id),
      admin.id,
    ]);
    await companyForm.trigger("adminIds");
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
                    : "Company Administrator"}
              </CardTitle>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {formStep === 0
                  ? "Enter company information"
                  : "Select the company Administrator. you can select multiple administrators but first one must be the primary administrator."}
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

        <CardContent
          className={`p-4 sm:pt-6 ${isOldCompany ? "max-h-[600px] overflow-y-auto" : ""}`}
        >
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

                  <motion.div variants={itemVariants} className="space-y-4">
                    <FormField
                      control={companyForm.control}
                      name="isOldCompany"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={isOldCompany}
                              onCheckedChange={(checked) => {
                                setIsOldCompany(checked as boolean);
                                if (!checked) {
                                  companyForm.setValue(
                                    "preferredSubscriptionPlan",
                                    undefined,
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>This is an old company</FormLabel>
                            <FormDescription>
                              Check this if you want to set a specific
                              subscription plan
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {isOldCompany && (
                      <FormField
                        control={companyForm.control}
                        name="preferredSubscriptionPlan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium dark:text-gray-300">
                              Subscription Plan
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value ?? undefined}
                            >
                              <FormControl>
                                <SelectTrigger className="border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400">
                                  <SelectValue placeholder="Select subscription plan" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                                <SelectItem
                                  value="data_foundation"
                                  className="text-gray-900 focus:bg-gray-100 dark:text-gray-100 dark:focus:bg-gray-700"
                                >
                                  Data Foundation
                                </SelectItem>
                                <SelectItem
                                  value="insight_accelerator"
                                  className="text-gray-900 focus:bg-gray-100 dark:text-gray-100 dark:focus:bg-gray-700"
                                >
                                  Insight Accelerator
                                </SelectItem>
                                <SelectItem
                                  value="strategic_navigator"
                                  className="text-gray-900 focus:bg-gray-100 dark:text-gray-100 dark:focus:bg-gray-700"
                                >
                                  Strategic Navigator
                                </SelectItem>
                                <SelectItem
                                  value="enterprise"
                                  className="text-gray-900 focus:bg-gray-100 dark:text-gray-100 dark:focus:bg-gray-700"
                                >
                                  Enterprise
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                              Select the preferred subscription plan for this
                              company
                            </FormDescription>
                            <FormMessage className="text-xs dark:text-red-400" />
                          </FormItem>
                        )}
                      />
                    )}
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

              {formStep === 1 && (
                <>
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={companyForm.control}
                      name="adminIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium dark:text-gray-300">
                            Company Administrator
                          </FormLabel>
                          <MultiSelect
                            options={
                              admins?.data.map((admin) => ({
                                value: admin.id,
                                label: `${admin.userName} - ${admin.email}`,
                              })) ?? []
                            }
                            selected={selectedAdmins.map((a) => a.id)}
                            onChange={(ids) => {
                              const newSelected = (admins?.data ?? []).filter(
                                (a) => ids.includes(a.id),
                              );
                              setSelectedAdmins(newSelected);
                              field.onChange(ids);
                            }}
                            placeholder="Select administrator(s)"
                            loading={adminsLoading}
                            disabled={adminsLoading}
                          />
                          <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                            Search and select one or more administrators. The
                            first one will be the primary administrator.
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
                          className="border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
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
                          className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
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

      <AdminCreationDialog
        open={showAdminForm}
        onOpenChange={setShowAdminForm}
        onAdminCreated={handleAdminCreated}
      />
    </div>
  );
};

export default CompanyForm;
