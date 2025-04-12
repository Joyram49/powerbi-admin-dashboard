"use client";

import type { SubmitHandler } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";
import { MultiSelect } from "../../../_components/multi-select";

// Define types for props
interface ReportModalProps {
  isOpen: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  report: {
    id: string;
    reportName: string;
    reportUrl: string;
    accessCount: number | null;
    dateCreated: Date | null;
    status: "active" | "inactive" | null;
    lastModifiedAt: Date | null;
    company: {
      id: string;
      companyName: string;
    } | null;
    userCount?: number;
  } | null;
  userRole: "superAdmin" | "admin" | "user";
}

// Define form schema using Zod
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

export function ReportModal({
  isOpen,
  onClose,
  report,
  userRole,
}: ReportModalProps) {
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch companies
  const { data: companiesData } = api.company.getAllCompanies.useQuery(
    undefined,
    { enabled: userRole === "superAdmin" },
  );

  // Create report mutation
  const { mutate: createReport } = api.report.create.useMutation({
    onSuccess: () => {
      toast.success("Success", {
        description: "Report created successfully",
      });
      onClose(true);
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
      setLoading(false);
    },
  });

  // Update report mutation
  const { mutate: updateReport } = api.report.updateReport.useMutation({
    onSuccess: () => {
      toast.success("Success", {
        description: "Report updated successfully",
      });
      onClose(true);
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
      setLoading(false);
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportName: report?.reportName ?? "",
      reportUrl: report?.reportUrl ?? "",
      companyId: report?.company.id ?? "",
      status: report?.status ?? "active",
      userIds: report?.userIds ?? [],
    },
  });

  // Reset form when report changes
  useEffect(() => {
    if (report) {
      form.reset({
        reportName: report.reportName,
        reportUrl: report.reportUrl,
        companyId: report.company.id,
        status: report.status,
        userIds: report.userIds ?? [],
      });
    } else {
      form.reset({
        reportName: "",
        reportUrl: "",
        companyId: "",
        status: "active",
        userIds: [],
      });
    }
  }, [report, form]);

  // Fetch users when company changes
  const selectedCompanyId = form.watch("companyId");

  const { data: usersData, refetch: refetchUsers } =
    api.user.getUsersByCompanyId.useQuery(
      { companyId: selectedCompanyId, limit: 100, page: 1 },
      { enabled: !!selectedCompanyId },
    );

  useEffect(() => {
    if (usersData?.users) {
      // Format users for multi-select
      const formattedUsers = usersData.users.map(
        (user: { id: string; userName: string; email: string }) => ({
          value: user.id,
          label: `${user.userName} | ${user.email}`,
        }),
      );
      setUsers(formattedUsers);
    }
  }, [usersData]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (selectedCompanyId) {
        try {
          await refetchUsers(); // Wait for the promise to resolve
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      }
    };

    fetchUsers();
  }, [selectedCompanyId, refetchUsers]);

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = (data) => {
    setLoading(true);
    if (report) {
      // Update existing report
      updateReport({
        reportId: report.id,
        reportName: data.reportName,
        reportUrl: data.reportUrl,
        status: data.status,
        userIds: data.userIds,
      });
    } else {
      // Create new report
      createReport(data);
    }
  };

  const handleClose = () => {
    onClose(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{report ? "Edit Report" : "Add New Report"}</DialogTitle>
        </DialogHeader>

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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!report}
                    value={field.value}
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
                  <FormLabel>Select Users for Access</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={users}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder="Select users"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                {loading
                  ? "Saving..."
                  : report
                    ? "Update Report"
                    : "Create Report"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
