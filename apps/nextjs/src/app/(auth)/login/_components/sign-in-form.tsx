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
  email: z
    .string({ message: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be between 8-20 characters" })
    .max(20, { message: "Password must be between 8-20 characters" })
    .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
      message:
        "Password must include at least one uppercase letter, one number, and one special character",
    }),
});

export function SignInForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const router = useRouter();

  const signIn = api.auth.signIn.useMutation();
  // const register = api.auth.createSuperAdmin.useMutation();

  function onSubmit(data: z.infer<typeof FormSchema>) {
    // const requestedData = {
    //   email: data.email,
    //   password: data.password,
    //   role: "superAdmin",
    //   userName: "appSuperAdminThree",
    // };
    signIn.mutate(data, {
      onError: (error) => {
        console.error("SignIn error:", error);
      },
      onSuccess: (result) => {
        console.log("signIn success:", result);
        router.push("/dashboard");
      },
    });
  }

  return (
    <Form {...form} className="flex w-full items-center justify-center">
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
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
                <Input placeholder="write your password" {...field} />
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
          Submit
        </Button>
      </form>
    </Form>
  );
}
