"use client";

import { useRouter } from "next/navigation";
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

import { api } from "~/trpc/react";

const CompanyFormSchema = z.object({
  companyName: z
    .string()
    .min(3, { message: "Company name must be at least 3 characters" }),
  address: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9+\-\s()]{5,20}$/.test(val), {
      message: "Please enter a valid phone number",
    }),
  email: z.string().email({ message: "Invalid email address" }),
  companyAdminId: z.string().uuid({ message: "Please select a company admin" }),
});

export function AddCompanyForm() {
  const router = useRouter();

  const form = useForm<z.infer<typeof CompanyFormSchema>>({
    resolver: zodResolver(CompanyFormSchema),
    defaultValues: {
      companyName: "",
      address: "",
      phone: "",
      email: "",
      companyAdminId: "",
    },
  });

  // Fetch users for admin selection
  const {
    data: usersData,
    isLoading,
    error: queryError,
  } = api.user.getAdminUsers.useQuery();

  const createCompany = api.company.create.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        form.reset();
        router.push("/company");
      }
    },
    onError: (error) => {
      console.error("Error creating company:", error);
    },
  });

  function onSubmit(data: z.infer<typeof CompanyFormSchema>) {
    createCompany.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {(createCompany.error ?? queryError) && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
            {createCompany.error?.message ?? queryError?.message}
          </div>
        )}

        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name*</FormLabel>
              <FormControl>
                <Input placeholder="Enter company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter company address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="Enter phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email*</FormLabel>
              <FormControl>
                <Input placeholder="company@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyAdminId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Admin*</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select admin user" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading users...
                    </SelectItem>
                  ) : usersData?.success && usersData.data.length > 0 ? (
                    usersData.data.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.userName} ({user.email}) - {user.role}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No users available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-foreground text-background hover:bg-foreground/90"
          disabled={createCompany.isPending || isLoading}
        >
          {createCompany.isPending ? "Creating..." : "Add Company"}
        </Button>
      </form>
    </Form>
  );
}
