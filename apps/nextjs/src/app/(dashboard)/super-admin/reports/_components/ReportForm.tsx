"use client";

import type { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";

import type { ReportWithUsers } from "@acme/db/schema";
import { reportRouterSchema } from "@acme/db/schema";
import { Button } from "@acme/ui/button";
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

import { MultiSelect } from "~/app/(dashboard)/_components/MultiSelect";
import { api } from "~/trpc/react";

// Define types
export interface ReportType {
  id: string;
  reportId?: string;
  reportName: string;
  reportUrl: string;
  accessCount?: number | null;
  dateCreated?: Date | null;
  status: "active" | "inactive" | null;
  lastModifiedAt?: Date | null;
  company: {
    id: string;
    companyName: string;
  } | null;
  userCounts?: number;
  usersList?: { id: string; name: string }[];
}

interface UserOption {
  value: string;
  label: string;
}

interface ReportFormProps {
  onClose: (shouldRefresh?: boolean) => void;
  initialData?: ReportWithUsers | null;
  userRole: "superAdmin" | "admin" | "user";
  companyId?: string;
}

export default function ReportForm({
  onClose,
  initialData,
  userRole,
  companyId,
}: ReportFormProps) {
  const [loading, setLoading] = useState(false);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const initialFormSetRef = useRef(false);
  const utils = api.useUtils();
  const router = useRouter();
  // Setup form with defaults
  const form = useForm<z.infer<typeof reportRouterSchema.create>>({
    resolver: zodResolver(reportRouterSchema.create),
    defaultValues: {
      reportName: initialData?.reportName ?? "",
      reportUrl: initialData?.reportUrl ?? "",
      companyId: initialData?.company?.id ?? companyId ?? "",
      status: initialData?.status ?? "active",
      userIds: initialData?.usersList?.map((user) => user.id) ?? [],
    },
  });

  // Watch for company ID changes to fetch users
  const companyIdForm = form.watch("companyId");

  // Reset user access when company changes
  useEffect(() => {
    if (companyIdForm) {
      form.setValue("userIds", []);
    }
  }, [companyIdForm, form]);

  // Fetch users for selected company
  const { data: usersData } = api.user.getUsersByCompanyId.useQuery(
    { companyId: companyIdForm, limit: 100, page: 1 },
    { enabled: !!companyIdForm },
  );

  // Fetch companies data
  const { data: companiesData, isLoading: isLoadingCompanies } =
    api.company.getAllActiveCompanies.useQuery(
      { limit: 1000 },
      {
        enabled: userRole === "superAdmin",
      },
    );

  // Fetch report details when editing - only if we have an ID and haven't set the form yet
  const { data: reportData, isLoading: isLoadingReport } =
    api.report.getReportById.useQuery(
      { reportId: initialData?.id ?? "" },
      { enabled: !!initialData?.id && !initialFormSetRef.current },
    );

  // Process users data for the MultiSelect component
  useEffect(() => {
    if (usersData?.users) {
      const options = usersData.users.map((user) => ({
        value: user.id,
        label: `${user.userName} | ${user.email}`,
      }));
      setUserOptions(options);
      setIsLoadingUsers(false);
    }
  }, [usersData]);

  // Handle success response
  const handleSuccess = async (message: string) => {
    await utils.report.getAllReports.invalidate();
    await utils.report.getAllReportsForCompany.invalidate();
    await utils.report.getAllReportsAdmin.invalidate();
    await utils.report.getReportById.invalidate();
    router.refresh();
    toast.success("Success", { description: message });
    setLoading(false);
    onClose(true);
  };

  // Handle error response
  const handleError = (message: string) => {
    toast.error("Error", { description: message });
    setLoading(false);
  };

  // TRPC mutations
  const createMutation = api.report.create.useMutation({
    onSuccess: () => handleSuccess("Report created successfully"),
    onError: (error) => handleError(error.message),
  });

  const updateMutation = api.report.updateReport.useMutation({
    onSuccess: () => handleSuccess("Report updated successfully"),
    onError: (error) => handleError(error.message),
  });

  // Update form with detailed report data when loaded - run only once
  useEffect(() => {
    if (reportData?.report && !initialFormSetRef.current) {
      const reportDetails = reportData.report as ReportWithUsers;
      form.reset({
        reportName: reportDetails.reportName,
        reportUrl: reportDetails.reportUrl,
        companyId: reportDetails.company?.id ?? "",
        status: reportDetails.status ?? "active",
        userIds: reportDetails.usersList?.map((user) => user.id) ?? [],
      });
      initialFormSetRef.current = true;
    }
  }, [reportData, form]);

  // Form submission handler
  const onSubmit = (data: z.infer<typeof reportRouterSchema.create>) => {
    setLoading(true);

    if (initialData?.id) {
      // Update existing report
      updateMutation.mutate({
        reportId: initialData.id,
        reportName: data.reportName,
        reportUrl: data.reportUrl,
        companyId: data.companyId,
        status: data.status,
        userIds: data.userIds,
      });
    } else {
      // Create new report
      createMutation.mutate(data);
    }
  };

  // If not superAdmin, don't allow access to modal
  if (userRole !== "superAdmin") {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <h3 className="mb-4 text-lg font-semibold">Unauthorized Access</h3>
        <p className="mb-4 text-center">
          You don't have permission to manage reports.
        </p>
        <Button
          onClick={() => {
            onClose(false);
          }}
        >
          Close
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      className="max-h-[70vh] overflow-y-auto rounded-lg p-6 pr-1 dark:border-gray-600 dark:bg-gray-900"
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="reportName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Report Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter report name"
                    {...field}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reportUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Report URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/report"
                    type="url"
                    {...field}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isLoadingCompanies ? "Loading companies..." : "Company"}
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                  value={field.value}
                  disabled={!!initialData}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    {companiesData?.data.map((company) => (
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                      <SelectValue placeholder="Select status" />
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="userIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Access</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={userOptions}
                    selected={field.value}
                    onChange={field.onChange}
                    placeholder="Select users"
                    loading={isLoadingUsers}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose(false);
              }}
              className="bg-gray-100 text-gray-900 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || isLoadingReport || isLoadingCompanies}
              className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {loading
                ? "Processing..."
                : initialData
                  ? "Update Report"
                  : "Create Report"}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
