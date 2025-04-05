"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Form, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
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
import { MultiSelect } from "../_components/multi-select";

const formSchema = z.object({
  reportName: z.string().min(3, "Report name must be at least 3 characters"),
  reportUrl: z.string().url("Please enter a valid URL"),
  companyId: z.string().uuid("Please select a company"),
  userIds: z.array(z.string().uuid()).min(1, "Please select at least one user"),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddReportPage() {
  const router = useRouter();

  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Get companies
  const { data: companies, isLoading: isLoadingCompanies } =
    api.company.getAllCompanies.useQuery();

  // Get users for selected company
  const { data: users, isLoading: isLoadingUsers } =
    api.user.getUsersByCompanyId.useQuery(
      { companyId: selectedCompany! },
      { enabled: !!selectedCompany },
    );

  // Create report mutation
  const createReport = api.report.create.useMutation({
    onSuccess: () => {
      toast.success("Report created", {
        description: "The report has been created successfully.",
      });

      router.push("/report");
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportName: "",
      reportUrl: "",
      userIds: [],
    },
  });

  const onSubmit = (values: FormValues) => {
    createReport.mutate(values);
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value);
    form.setValue("companyId", value);
    form.setValue("userIds", []);
  };

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Report</h1>
        <p className="mt-2 text-muted-foreground">
          Create a new report and assign it to users
        </p>
      </div>

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
                  <Input placeholder="https://" type="url" {...field} />
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
                <Select onValueChange={handleCompanyChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingCompanies ? (
                      <SelectItem value="loading" disabled>
                        Loading companies...
                      </SelectItem>
                    ) : companies?.data?.length ? (
                      companies.data.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.companyName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No companies found
                      </SelectItem>
                    )}
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
                    selected={field.value}
                    setSelected={(values) => field.onChange(values)}
                    options={
                      users?.users.map((user) => ({
                        value: user.id,
                        label: `$ (${user.email})`,
                      })) ?? []
                    }
                    placeholder="Select users"
                    loading={isLoadingUsers}
                    disabled={!selectedCompany}
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
              onClick={() => router.push("/reports")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Report
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
