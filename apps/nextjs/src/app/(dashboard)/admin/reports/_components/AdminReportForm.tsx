"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Check, ChevronsUpDown, Loader2, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { toast } from "@acme/ui/toast";

import { MultiSelect } from "~/app/(dashboard)/_components/MultiSelect";
import { api } from "~/trpc/react";

interface User {
  id: string;
  userName: string;
  email: string;
  status: "active" | "inactive" | null;
  modifiedBy: string | null;
  companyId: string | null;
  role: "user" | "superAdmin" | "admin";
  dateCreated: Date;
  lastLogin: Date | null;
  company: {
    companyName: string;
  } | null;
}

interface UserOption {
  value: string;
  label: string;
}

// Define form schema
const formSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, {
    message: "At least one user must be selected",
  }),
});

interface AdminReportFormProps {
  onClose: (shouldRefresh?: boolean) => void;
  initialData: {
    id: string;
    reportName: string;
    userIds: string[];
    companyId: string;
  };
}

export default function AdminReportForm({
  onClose,
  initialData,
}: AdminReportFormProps) {
  const utils = api.useUtils();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const initialFormSetRef = useRef(false);

  // Setup form with defaults
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userIds: initialData.userIds,
    },
  });

  // Fetch users for the company
  const { data: usersData, isLoading } = api.user.getUsersByCompanyId.useQuery({
    companyId: initialData.companyId,
    limit: 100,
    page: 1,
  });

  // Process users data for the MultiSelect component
  useEffect(() => {
    if (usersData?.users) {
      const options = usersData.users.map((user: User) => ({
        value: user.id,
        label: `${user.userName} | ${user.email}`,
      }));
      setUserOptions(options);
      setIsLoadingUsers(false);
    }
  }, [usersData]);

  const updateReportMutation = api.report.updateReport.useMutation({
    onSuccess: async () => {
      toast.success("Report access updated successfully");
      setIsSubmitting(false);
      await utils.report.getAllReports.invalidate();
      await utils.report.getAllReportsAdmin.invalidate();
      onClose(true);
    },
    onError: (error) => {
      console.error("Update report error:", error);
      toast.error("Failed to update report access", {
        description: error.message || "An error occurred",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await updateReportMutation.mutateAsync({
        reportId: initialData.id,
        userIds: values.userIds,
      });
    } catch (error) {
      console.error("Error updating report:", error);
    }
  };

  return (
    <Form {...form}>
      <motion.form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <FormField
              control={form.control}
              name="userIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-sm font-medium dark:text-gray-300">
                    Users with Access
                  </FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={userOptions}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder="Select users"
                      loading={isLoadingUsers}
                    />
                  </FormControl>
                  <FormMessage className="text-xs dark:text-red-400" />
                </FormItem>
              )}
            />
          </motion.div>
        </motion.div>

        <motion.div
          className="flex justify-end gap-3 pt-2"
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onClose();
            }}
            className="border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center text-white">
                <Save className="mr-2 h-4 w-4" />
                Update Access
              </div>
            )}
          </Button>
        </motion.div>
      </motion.form>
    </Form>
  );
}
