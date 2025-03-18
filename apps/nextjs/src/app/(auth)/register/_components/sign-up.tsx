"use client";

import Link from "next/link";
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

import { api } from "~/trpc/react";

const FormSchema = z.object({
  userName: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be between 8-20 characters" })
    .max(20, { message: "Password must be between 8-20 characters" })
    .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
      message:
        "Password must include at least one uppercase letter, one number, and one special character",
    }),
});

export function SignUpForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      userName: "",
      email: "",
      password: "",
    },
  });

  const router = useRouter();

  const register = api.auth.createSuperAdmin.useMutation();

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const requestedData = { ...data, role: "superAdmin" };
    register.mutate(requestedData, {
      onError: (error) => {
        console.error("Signup error:", error);
      },
      onSuccess: (result) => {
        console.log("Signup success:", result);
        form.reset();
        router.push("/login");
      },
    });
  }

  return (
    <Form {...form} className="flex w-full items-center justify-center">
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <FormField
          control={form.control}
          name="userName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="example@mail.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <Link href="/forgot-password">Forgot your Password?</Link>
        </div>
        <Button
          type="submit"
          className="w-full bg-foreground text-background hover:bg-foreground/90"
        >
          Sign Up
        </Button>
      </form>
    </Form>
  );
}
