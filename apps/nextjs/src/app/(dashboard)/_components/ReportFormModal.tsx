"use client";

import React, { useEffect } from "react";
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

import { MultiSelect } from "~/app/(dashboard)/_components/multi-select";
import { api } from "~/trpc/react";

// Define type for the form schema
const reportFormSchema = z.object({
  reportName: z
    .string()
    .min(3, { message: "Report name must be at least 3 characters" }),
  reportUrl: z.string().url({ message: "Please enter a valid URL" }),
  companyId: z.string().uuid({ message: "Please select a company" }),
  status: z.enum(["active", "inactive"]),
  userIds: z.array(z.string().uuid()).optional(),
});

// Extract type from the schema
type ReportFormValues = z.infer<typeof reportFormSchema>;

// Define types for props
interface Company {
  id: string;
  companyName: string;
}

interface User {
  id: string;
  userName: string;
  email: string;
}

interface ReportInitialData {
  id?: string;
  reportName?: string;
  reportUrl?: string;
  status?: "active" | "inactive" | string | null;
  company?: {
    id: string;
    companyName: string;
  } | null;
}

interface ReportFormProps {
  initialData?: ReportInitialData | null;
  isLoading?: boolean;
  onSubmit: (data: ReportFormValues) => void;
  onCancel: () => void;
}

export default function ReportForm({
  initialData,
  isLoading = false,
  onSubmit,
  onCancel,
}: ReportFormProps) {
  const { data: userInfo } = api.auth.getProfile.useQuery();
  const userRole = userInfo?.user.user_metadata.role as string;

  // Setup form with validation
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reportName: initialData?.reportName ?? "",
      reportUrl: initialData?.reportUrl ?? "",
      companyId: initialData?.company?.id ?? "",
      status: (initialData?.status as "active" | "inactive") || "active",
      userIds: [],
    },
  });

  // Get current company ID from form
  const companyId = form.watch("companyId");

  // Get companies for dropdown
  const { data: companiesData } = api.company.getAllCompanies.useQuery(
    { limit: 100 },
    { enabled: userRole === "superAdmin" },
  );
  const companies = companiesData?.data ?? ([] as Company[]);

  // Get users for the selected company
  const { data: usersData } = api.user.getUsersByCompanyId.useQuery(
    { companyId },
    { enabled: !!companyId },
  );
  const users = usersData?.users ?? ([] as User[]);

  // Update form when initialData changes (edit mode)
  useEffect(() => {
    if (initialData) {
      // Fixed: Only reset when initialData changes, not on every render
      form.reset({
        reportName: initialData.reportName || "",
        reportUrl: initialData.reportUrl || "",
        companyId: initialData.company?.id || "",
        status: (initialData.status as "active" | "inactive") || "active",
        userIds: [], // We'll set this later when we have the actual assigned users
      });
    }
  }, [initialData, form]);

  // Handle form submission
  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
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
                <Input placeholder="https://example.com/report" {...field} />
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
                  form.setValue("companyId", value);
                  form.setValue("userIds", []);
                }}
                value={field.value}
                disabled={!companies.length}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((company) => (
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
              <FormLabel>Assign Users</FormLabel>
              <FormControl>
                <MultiSelect
                  options={users.map((user) => ({
                    value: user.id,
                    label: `${user.userName} (${user.email})`,
                  }))}
                  selected={field.value ?? []}
                  setSelected={field.onChange}
                  placeholder="Select users to assign"
                  disabled={!companyId || !users.length}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : initialData
                ? "Update Report"
                : "Create Report"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
