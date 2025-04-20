// app/signup/page.tsx
import type { Metadata } from "next";
import { SignUpForm } from "../_components/SignUp";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create an account to get started",
};

// Server Component Page
export default function SignUpPage() {
  return (
    <div className="container mx-auto py-10">
      <SignUpForm />
    </div>
  );
}
