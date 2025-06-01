import { redirect } from "next/navigation";

import { stripe } from "@acme/api";
import { Button } from "@acme/ui/button";

import { api } from "~/trpc/server";

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
    expand: ["line_items", "payment_intent", "customer"],
  });

  console.log(checkoutSession);

  const { status } = checkoutSession;
  const { companyId } = checkoutSession.metadata ?? {};
  const customerEmail = checkoutSession.customer_details?.email ?? "your email";

  if (companyId) {
    try {
      await api.company.resetNullCompanyPreferredSubscriptionPlan({
        companyId,
      });
    } catch (error) {
      console.error("Failed to reset subscription plan:", error);
    }
  }

  if (status === "open") {
    return redirect("/");
  }

  if (status === "complete") {
    return (
      <SuccessContent
        customerEmail={customerEmail}
        paymentDetails={paymentDetails}
      />
    );
  }

  // Fallback for other status types
  return redirect("/");
}
