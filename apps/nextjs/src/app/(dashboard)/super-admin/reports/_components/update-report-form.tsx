"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@acme/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";

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
  userCounts?: number;
  usersList?: { id: string; name: string }[];
}

interface UserOption {
  value: string;
  label: string;
}

interface ReportFormProps {
  onClose: (shouldRefresh?: boolean) => void;
  setDialogOpen?: (open: boolean) => void;
  reportId?: string;
  userRole: "superAdmin" | "admin" | "user";
  companyId?: string;
}

// update report form schema
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
  setDialogOpen,
  reportId,
}: ReportFormProps) {
  const [loading, setLoading] = useState(false);
  const [allUserOptions, setAllUserOptions] = useState<UserOption[]>([]);
  const [availableUserOptions, setAvailableUserOptions] = useState<
    UserOption[]
  >([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const utils = api.useUtils();

  // form's default values
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

  // Get report data
  const {
    data: reportData,
    isLoading: isLoadingReport,
    isSuccess: isSuccessReport,
    isError: isErrorReport,
    error: errorReport,
  } = api.report.getReportById.useQuery(
    { reportId: reportId ?? "" },
    {
      enabled: !!reportId,
    },
  );

  // form's watch values to get company id and selected user ids
  const companyId = form.watch("companyId");
  const selectedUserIds = form.watch("userIds");

  // form's reset values and set all user options after report data is loaded
  useEffect(() => {
    if (isSuccessReport) {
      form.reset({
        reportName: reportData.report.reportName,
        reportUrl: reportData.report.reportUrl,
        companyId: reportData.report.company?.id ?? "",
        status: reportData.report.status ?? "active",
        userIds:
          reportData.report.usersList.length > 0
            ? reportData.report.usersList.map((user) => user.id)
            : [],
      });

      // Convert usersList to options format for display
      if (reportData.report.usersList.length > 0) {
        const userOptions = reportData.report.usersList.map((user) => ({
          value: user.id,
          label: user.name,
        }));
        setAllUserOptions(userOptions);
      }
    }
  }, [isSuccessReport, reportData, form]);

  // get users by company id
  const {
    data: companyUsers,
    isLoading: isLoadingUsers,
    isSuccess: isSuccessUsers,
    isError: isUserError,
    error: userError,
  } = api.user.getUsersByCompanyId.useQuery(
    { companyId, limit: 100, page: 1 },
    { enabled: !!companyId && companyId !== "" },
  );

  // Update availableUserOptions when companyUsers or selected users change
  useEffect(() => {
    if (isSuccessUsers) {
      const newAvailableOptions = companyUsers.users
        .filter((user) => !selectedUserIds.includes(user.id))
        .map((user) => ({
          value: user.id,
          label: user.userName || user.email || "Unknown User",
        }));
      setAvailableUserOptions(newAvailableOptions);
    }
  }, [isSuccessUsers, companyUsers, selectedUserIds]);

  // Handle success response
  const handleSuccess = async (message: string) => {
    await utils.report.getAllReports.invalidate();
    await utils.report.getAllReportsForCompany.invalidate();
    await utils.report.getAllReportsAdmin.invalidate();
    toast.success("Success", { description: message });
    setLoading(false);
    onClose(true);
  };

  // Handle error response
  const handleError = (message: string) => {
    toast.error("Error", { description: message });
    setLoading(false);
  };

  // update report mutation
  const updateMutation = api.report.updateReport.useMutation({
    onSuccess: () => handleSuccess("Report updated successfully"),
    onError: (error) => handleError(error.message),
  });

  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    updateMutation.mutate({
      reportId,
      reportName: data.reportName,
      reportUrl: data.reportUrl,
      status: data.status,
      userIds: data.userIds,
    });
  };

  // Handle removing a user from selection
  const handleRemoveUser = (userId: string) => {
    const currentUserIds = form.getValues("userIds");
    const selectedUser = allUserOptions.find((user) => user.value === userId);
    const updatedUserIds = currentUserIds.filter((id) => id !== userId);
    form.setValue("userIds", updatedUserIds);
    setAllUserOptions(allUserOptions.filter((user) => user.value !== userId));
    if (selectedUser) {
      setAvailableUserOptions((prev) => [...prev, selectedUser]);
    }
  };

  // Handle adding a user from dropdown
  const handleAddUser = (userId: string) => {
    // Get the selected user from available options
    const selectedUser = availableUserOptions.find(
      (user) => user.value === userId,
    );

    if (selectedUser) {
      // Update form values
      const currentUserIds = form.getValues("userIds");
      const updatedUserIds = [...currentUserIds, userId];
      form.setValue("userIds", updatedUserIds);

      // Update UI state
      setAllUserOptions([...allUserOptions, selectedUser]);

      // Close the dropdown
      setUserDropdownOpen(false);
    }
  };

  // handle form at loading state
  if (isLoadingReport) {
    return (
      <div className="mb-4 rounded-md bg-blue-50 p-2 text-center dark:bg-blue-900/20">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-blue-500" />
        <span className="text-sm text-blue-600 dark:text-blue-300">
          Loading report data...
        </span>
      </div>
    );
  }

  return (
    <div
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

      {isErrorReport && (
        <div className="mb-4 rounded-md bg-red-50 p-2 text-center dark:bg-red-900/20">
          <span className="text-sm text-red-600 dark:text-red-300">
            Error loading report data: {errorReport.message}
          </span>
        </div>
      )}

      {isUserError && (
        <div className="mb-4 rounded-md bg-red-50 p-2 text-center dark:bg-red-900/20">
          <span className="text-sm text-red-600 dark:text-red-300">
            Error loading users: {userError.message}
          </span>
        </div>
      )}
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
            render={() => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input
                    disabled
                    value={reportData?.report.company?.companyName}
                    className="bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  />
                </FormControl>
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
            render={() => (
              <FormItem className="space-y-4">
                <FormLabel>User Access</FormLabel>

                {/* User list */}
                <div className="mt-2 space-y-2">
                  {allUserOptions.length > 0 &&
                    allUserOptions.map((user) => (
                      <div
                        key={user.value}
                        className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <span className="font-medium dark:text-white">
                          {user.label}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(user.value)}
                          className="h-7 w-7 rounded-full p-0 hover:bg-red-300/60 dark:hover:bg-red-800/40"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  {allUserOptions.length === 0 && (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                      No users assigned to this report
                    </div>
                  )}
                </div>

                {/* User selector combobox */}
                <div className="pt-2">
                  <Popover
                    open={userDropdownOpen}
                    onOpenChange={setUserDropdownOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userDropdownOpen}
                        className="w-full justify-between border border-input bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <span className="text-muted-foreground dark:text-gray-400">
                          Add user access...
                        </span>
                        {isLoadingUsers ? (
                          <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                        ) : (
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full min-w-[200px] border p-0 dark:border-gray-700 dark:bg-gray-800"
                      align="start"
                    >
                      <Command className="dark:bg-gray-800">
                        <CommandInput
                          placeholder="Search users..."
                          className="dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                        />
                        <CommandList className="dark:bg-gray-800">
                          <CommandGroup className="dark:bg-gray-800">
                            {isLoadingUsers ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground dark:text-gray-400" />
                              </div>
                            ) : (
                              availableUserOptions.map((user) => (
                                <CommandItem
                                  key={user.value}
                                  onSelect={() => handleAddUser(user.value)}
                                  className="cursor-pointer dark:bg-gray-900 dark:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                                >
                                  <div className="flex w-full items-center justify-between">
                                    <span className="font-medium">
                                      {user.label}
                                    </span>
                                    <Check className="h-4 w-4 text-primary opacity-0 dark:text-blue-400" />
                                  </div>
                                </CommandItem>
                              ))
                            )}
                            {availableUserOptions.length === 0 &&
                              !isLoadingUsers && (
                                <div className="px-2 py-4 text-center text-sm dark:text-gray-400">
                                  No more users available to add.
                                </div>
                              )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

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
              disabled={loading || isLoadingReport}
              className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {loading ? "Processing..." : "Update Report"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
