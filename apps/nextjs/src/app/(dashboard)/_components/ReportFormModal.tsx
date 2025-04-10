"use client";

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
import { MultiSelect } from "./multi-select";

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
  userIds: z.array(z.string().uuid()).optional(),
});

export function ReportModal({ isOpen, onClose, report, userRole }: any) {
  const [users, setUsers] = useState([]);
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

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportName: report?.reportName ?? "",
      reportUrl: report?.reportUrl ?? "",
      companyId: report?.company?.id ?? "",
      status: report?.status ?? "active",
      userIds: [],
    },
  });

  // Fetch users when company changes
  const selectedCompanyId = form.watch("companyId");

  const { data: usersData, refetch: refetchUsers } =
    api.user.getUsersByCompanyId.useQuery(
      { companyId: selectedCompanyId, limit: 10, page: 1 },
      { enabled: !!selectedCompanyId },
    );

  // Get report users if editing
  // const { data: reportUsersData } = api.user.getUsersByReportId.useQuery(
  //   { reportId: report?.id },
  //   { enabled: !!report?.id },
  // );

  useEffect(() => {
    if (usersData?.users) {
      // Format users for multi-select
      const formattedUsers = usersData.users.map((user: any) => ({
        value: user.id,
        label: `${user.userName} | ${user.email}`,
      }));
      setUsers(formattedUsers);
    }
  }, [usersData]);

  // Set report users when data is loaded
  // useEffect(() => {
  //   if (report && reportUsersData?.users) {
  //     const userIds = reportUsersData.users.map((user) => user.id);
  //     form.setValue("userIds", userIds);
  //   }
  // }, [report, reportUsersData, form]);

  // Update users list when company changes
  useEffect(() => {
    if (selectedCompanyId) {
      refetchUsers();
    }
  }, [selectedCompanyId, refetchUsers]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    if (report) {
      // Update existing report
      updateReport({
        reportId: report.id,
        ...data,
      });
    } else {
      // Create new report
      createReport(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                    defaultValue={field.value ?? []}
                    disabled={!!report}
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose(false)}
              >
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
