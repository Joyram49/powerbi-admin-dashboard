"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

import { api } from "~/trpc/react";
import { MultiSelect } from "~/app/(dashboard)/_components/MultiSelect";

// Define types
export interface ReportType {
  id: string;
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
  userCount?: number;
  userIds?: string[];
}

interface ReportFormProps {
  onClose: (shouldRefresh?: boolean) => void;
  initialData?: ReportType | null;
  userRole: "superAdmin" | "admin" | "user";
}

// Define form schema
const formSchema = z.object({
  reportName: z.string().min(3, {
    message: "Report name must be at least 3 characters",
  }),
  reportUrl: z.string().url({
    message: "Please enter a valid URL",
  }),
  companyId: z.string().uuid({
    message: "Please select a company",
  }),
  status: z.enum(["active", "inactive"]),
  userIds: z.array(z.string().uuid()),
});

export default function ReportForm({
  onClose,
  initialData,
  userRole,
}: ReportFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);

  // Setup form with defaults
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportName: "",
      reportUrl: "",
      companyId: "",
      status: "active",
      userIds: [],
    },
  });

  // Watch for company ID changes to fetch users
  const companyId = form.watch("companyId");

  // Fetch companies data
  const { data: companiesData } = api.company.getAllCompanies.useQuery(
    undefined,
    { enabled: userRole === "superAdmin" },
  );

  // Fetch users for selected company
  const { data: usersData } = api.user.getUsersByCompanyId.useQuery(
    { companyId, limit: 100, page: 1 },
    { enabled: !!companyId },
  );

  // TRPC mutations
  const createMutation = api.report.create.useMutation({
    onSuccess: () => handleSuccess("Report created successfully"),
    onError: (error) => handleError(error.message),
  });

  const updateMutation = api.report.updateReport.useMutation({
    onSuccess: () => handleSuccess("Report updated successfully"),
    onError: (error) => handleError(error.message),
  });

  // Fetch report details when editing
  const { data: reportData, isLoading: isLoadingReport } =
    api.report.getReportById.useQuery(
      { reportId: initialData?.id ?? "" },
      { enabled: !!initialData?.id },
    );

  // Initialize form when report changes or data is loaded
  useEffect(() => {
    if (initialData) {
      // Editing existing report
      const formData = {
        reportName: initialData.reportName || "",
        reportUrl: initialData.reportUrl || "",
        companyId: initialData.company?.id ?? "",
        status: initialData.status ?? "active",
        userIds: initialData.userIds ?? [],
      };

      form.reset(formData);
    } else {
      // Creating new report
      form.reset({
        reportName: "",
        reportUrl: "",
        companyId: "",
        status: "active",
        userIds: [],
      });
    }
  }, [initialData, form]);

  // Update form with detailed report data when loaded
  useEffect(() => {
    if (reportData?.report) {
      const reportDetails = reportData.report as ReportType;
      form.setValue("reportName", reportDetails.reportName);
      form.setValue("reportUrl", reportDetails.reportUrl);
      form.setValue("companyId", reportDetails.company?.id ?? "");
      form.setValue("status", reportDetails.status ?? "active");
      form.setValue("userIds", reportDetails.userIds ?? []);
    }
  }, [reportData, form]);

  // Format users for multi-select
  useEffect(() => {
    if (usersData?.users) {
      const formattedUsers = usersData.users.map((user) => ({
        value: user.id,
        label: `${user.userName} | ${user.email}`,
      }));
      setUsers(formattedUsers);
    }
  }, [usersData]);

  const utils = api.useUtils();
  // Form submission handler
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
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
    await utils.report.getAllReports.invalidate();
    await utils.report.getAllReportsForCompany.invalidate();
    await utils.report.getAllReportsAdmin.invalidate();
  };

  // Handle success response
  const handleSuccess = (message: string) => {
    toast.success("Success", { description: message });
    setLoading(false);
    onClose(true);
  };

  // Handle error response
  const handleError = (message: string) => {
    toast.error("Error", { description: message });
    setLoading(false);
  };

  // If not superAdmin, don't allow access to modal
  if (userRole !== "superAdmin") {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <h3 className="mb-4 text-lg font-semibold">Unauthorized Access</h3>
        <p className="mb-4 text-center">
          You don't have permission to manage reports.
        </p>
        <Button onClick={() => onClose(false)}>Close</Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900">
      <h2 className="mb-6 text-xl font-bold">
        {initialData ? "Edit Report" : "Create New Report"}
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="reportName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Report Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter report name" {...field} />
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
                <FormLabel>Company</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Reset selected users when company changes
                    if (value !== field.value) {
                      form.setValue("userIds", []);
                    }
                  }}
                  value={field.value}
                  disabled={!!initialData} // Can't change company when editing
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companiesData?.data?.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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
                    options={users}
                    selected={field.value}
                    onChange={field.onChange}
                    placeholder="Select users who can access this report"
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
              onClick={() => onClose(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || isLoadingReport}
              className="bg-blue-500 text-white hover:bg-blue-600"
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
    </div>
  );
}
