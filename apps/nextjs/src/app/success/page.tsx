import Link from "next/link";
import { redirect } from "next/navigation";

import { stripe } from "@acme/api";
import { Button } from "@acme/ui/button";

interface SuccessPageProps {
  searchParams: {
    session_id?: string;
  };
}

export default async function Success({ searchParams }: SuccessPageProps) {
  const { session_id } = searchParams;

  if (!session_id)
    throw new Error("Please provide a valid session_id (`cs_test_...`)");

  const checkoutSession = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ["line_items", "payment_intent"],
  });

  const { status } = checkoutSession;
  const customerEmail = checkoutSession.customer_details?.email ?? "your email";

  if (status === "open") {
    return redirect("/");
  }

  if (status === "complete") {
    return (
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              Payment Successful!
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              We appreciate your business! A confirmation email will be sent to{" "}
              <span className="font-semibold">{customerEmail}</span>.
            </p>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              If you have any questions, please email{" "}
              <a
                href="mailto:orders@example.com"
                className="text-blue-500 hover:underline"
              >
                orders@example.com
              </a>
            </p>
          </div>
          <Link href="/user">
            <Button className="w-full">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Fallback for other status types
  return redirect("/");
}
