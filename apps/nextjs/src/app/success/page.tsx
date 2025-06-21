import type Stripe from "stripe";
import { redirect } from "next/navigation";

import { stripe } from "@acme/api";
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/server";
import { SuccessContent } from "./SuccessContent";

interface SuccessPageProps {
  searchParams: {
    session_id?: string;
  };
}

// Function to generate payment details from Stripe checkout session
function generatePaymentDetails(checkoutSession: Stripe.Checkout.Session) {
  const lineItems = checkoutSession.line_items?.data ?? [];

  // Format order items
  const orderItems = lineItems.map((item) => ({
    name: item.description || "Unknown Item",
    quantity: item.quantity,
    amount: (item.amount_total / 100).toFixed(2),
  }));

  // Get payment method from payment_method_types
  let paymentMethod = "Unknown";
  if (checkoutSession.payment_method_types.length > 0) {
    paymentMethod = checkoutSession.payment_method_types[0];
  }

  // Format date
  const orderDate = new Date(checkoutSession.created * 1000).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return {
    amount: (checkoutSession.amount_total / 100).toFixed(2),
    currency: checkoutSession.currency?.toUpperCase() ?? "USD",
    paymentStatus: checkoutSession.payment_status,
    paymentMethod: paymentMethod,
    orderItems: orderItems,
    orderDate: orderDate,
    orderId: checkoutSession.id,
  };
}

export default async function Success({ searchParams }: SuccessPageProps) {
  const { session_id } = searchParams;

  if (!session_id)
    throw new Error("Please provide a valid session_id (`cs_test_...`)");

  const checkoutSession = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ["line_items", "customer"],
  });

  const { status } = checkoutSession;
  const { companyId } = checkoutSession.metadata ?? {};
  const customerEmail = checkoutSession.customer_details?.email ?? "no email";

  if (companyId) {
    try {
      await api.company.resetNullCompanyPreferredSubscriptionPlan({
        companyId,
      });
    } catch (error) {
      toast.error("Failed to reset subscription plan:", error);
    }
  }

  if (status === "open") {
    return redirect("/");
  }

  if (status === "complete") {
    const paymentDetails = generatePaymentDetails(checkoutSession);

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
