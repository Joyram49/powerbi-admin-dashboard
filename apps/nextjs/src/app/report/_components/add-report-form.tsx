"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

import { api } from "~/trpc/react";

// const ReportFormSchema = z.object({
//   reportName: z
//     .string()
//     .min(3, { message: "Report name must be at least 3 characters" }),
//   reportUrl: z.string().url({ message: "Invalid URL format" }),
//   companyId: z.string().uuid({ message: "Please select a company" }),
//   userIds: z
//     .array(z.string().uuid())
//     .min(1, { message: "Select at least one user" }),
// });

const ReportFormSchema = z.object({
  reportName: z.string().min(3).optional().or(z.literal("")), // Allow empty string
  reportUrl: z.string().url().optional().or(z.literal("")), // Allow empty string
  companyId: z.string().uuid().optional().or(z.literal("")), // Allow empty string
  userIds: z
    .array(z.string().uuid())
    .optional()
    .or(z.array(z.string().uuid()).length(0)), // Allow empty array
});

export function AddReportForm() {
  const router = useRouter();

  const form = useForm<z.infer<typeof ReportFormSchema>>({
    resolver: zodResolver(ReportFormSchema),
    defaultValues: {
      reportName: "",
      reportUrl: "",
      companyId: "",
      userIds: [],
    },
  });

  // Fetch companies
  const { data: companiesData, isLoading: loadingCompanies } =
    api.company.getAllCompanies.useQuery();

  // Fetch users
  const { data: usersData, isLoading: loadingUsers } =
    api.user.getAllGeneralUser.useQuery();

  // Report mutation
  const createReport = api.report.create.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        form.reset();
        router.push("/report");
      }
    },
    onError: (error) => {
      console.error("Error creating report:", error);
    },
  });

  function onSubmit(data: z.infer<typeof ReportFormSchema>) {
    createReport.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {createReport.error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
            {createReport.error.message}
          </div>
        )}

        <FormField
          control={form.control}
          name="reportName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Name*</FormLabel>
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
              <FormLabel>Report URL*</FormLabel>
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
              <FormLabel>Company*</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingCompanies ? (
                    <SelectItem value="loading" disabled>
                      Loading companies...
                    </SelectItem>
                  ) : companiesData?.data.length > 0 ? (
                    companiesData.data.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.companyName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No companies available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Multi-select users using checkboxes inside a dropdown */}
        <FormField
          control={form.control}
          name="userIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attach Users*</FormLabel>
              <FormControl>
                <div className="rounded-md border p-2">
                  {loadingUsers ? (
                    <div className="text-sm text-gray-500">
                      Loading users...
                    </div>
                  ) : usersData?.data.length > 0 ? (
                    usersData.data.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          checked={field.value.includes(user.id)}
                          onCheckedChange={(checked) => {
                            const newUserIds = checked
                              ? [...field.value, user.id]
                              : field.value.filter((id) => id !== user.id);
                            field.onChange(newUserIds);
                          }}
                        />
                        <span className="text-sm">
                          {user.userName} ({user.email})
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">
                      No users available
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-foreground text-background hover:bg-foreground/90"
          disabled={createReport.isPending || loadingCompanies || loadingUsers}
        >
          {createReport.isPending ? "Creating..." : "Add Report"}
        </Button>
      </form>
    </Form>
  );
}
