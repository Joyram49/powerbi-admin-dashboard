"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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

// Define form schema for step 1
const step1Schema = z.object({
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
});

// Define form schema for step 2
const step2Schema = z.object({
  userIds: z.array(z.string().uuid()).min(1, {
    message: "Please select at least one user",
  }),
});

interface User {
  id: string;
  userName: string | null;
  email: string;
}

interface AddReportFormProps {
  onClose: (shouldRefresh?: boolean) => void;
  setDialogOpen?: (open: boolean) => void;
}

export default function AddReportForm({
  onClose,
  setDialogOpen,
}: AddReportFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const utils = api.useUtils();

  // Setup form with defaults for step 1
  const form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      reportName: "",
      reportUrl: "",
      companyId: "",
      status: "active",
    },
  });

  // Watch for company ID changes
  const companyId = form.watch("companyId");

  // Fetch companies data
  const { data: companiesData, isLoading: isLoadingCompanies } =
    api.company.getAllCompanies.useQuery();

  // Fetch users when company is selected
  useEffect(() => {
    const fetchUsers = async () => {
      if (companyId) {
        setIsLoadingUsers(true);
        try {
          const users = await utils.user.getUsersByCompanyId.fetch({
            companyId,
            limit: 100,
            page: 1,
          });
          setCompanyUsers(users.users);
        } catch (error) {
          toast.error("Error", {
            description:
              error instanceof Error
                ? error.message
                : "Failed to fetch users for this company",
          });
        } finally {
          setIsLoadingUsers(false);
        }
      }
    };

    void fetchUsers();
  }, [companyId, utils.user.getUsersByCompanyId]);

  // Handle success response
  const handleSuccess = async (message: string) => {
    await utils.report.getAllReports.invalidate();
    await utils.report.getAllReportsForCompany.invalidate();
    toast.success("Success", { description: message });
    setLoading(false);
    onClose(true);
  };

  // Handle error response
  const handleError = (message: string) => {
    toast.error("Error", { description: message });
    setLoading(false);
  };

  // Create report mutation
  const createMutation = api.report.create.useMutation({
    onSuccess: () => handleSuccess("Report created successfully"),
    onError: (error) => handleError(error.message),
  });

  // Handle step 1 submission
  const onStep1Submit = (data: z.infer<typeof step1Schema>) => {
    setStep(2);
  };

  // Handle step 2 submission
  const onStep2Submit = () => {
    if (selectedUsers.length === 0) {
      toast.error("Error", {
        description: "Please select at least one user",
      });
      return;
    }

    setLoading(true);
    const step1Data = form.getValues();
    createMutation.mutate({
      ...step1Data,
      userIds: selectedUsers,
    });
  };

  // Handle user selection
  const handleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto rounded-lg p-6 pr-1 dark:border-gray-600 dark:bg-gray-900">
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onStep1Submit)} className="space-y-6">
          {step === 1 ? (
            <>
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
                    <FormLabel>Company</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:border-gray-700 dark:bg-gray-800">
                        {companiesData?.data?.map((company) => (
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

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen?.(false);
                    onClose(false);
                  }}
                  className="bg-gray-100 text-gray-900 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || isLoadingCompanies}
                  className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Select Users</h3>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {companyUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <input
                          type="checkbox"
                          id={user.id}
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelection(user.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                        />
                        <label
                          htmlFor={user.id}
                          className="flex-1 cursor-pointer font-medium dark:text-white"
                        >
                          {user.userName ?? user.email}
                        </label>
                      </div>
                    ))}
                    {companyUsers.length === 0 && (
                      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        No users found for this company
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="bg-gray-100 text-gray-900 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={onStep2Submit}
                  disabled={loading || isLoadingUsers}
                  className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  {loading ? "Creating..." : "Create Report"}
                </Button>
              </div>
            </>
          )}
        </form>
      </Form>
    </div>
  );
}
