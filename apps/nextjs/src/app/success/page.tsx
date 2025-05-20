import { redirect } from "next/navigation";

import { stripe } from "@acme/api";

import { SuccessContent } from "./SuccessContent";

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

  const { status } = checkoutSession;
  const customerEmail = checkoutSession.customer_details?.email ?? "your email";

  // Extract payment details
  const paymentDetails = {
    amount: checkoutSession.amount_total
      ? (checkoutSession.amount_total / 100).toFixed(2)
      : "0.00",
    currency: checkoutSession.currency?.toUpperCase() ?? "USD",
    paymentStatus: checkoutSession.payment_status,
    paymentMethod: checkoutSession.payment_method_types[0] ?? "card",
    orderItems:
      checkoutSession.line_items?.data.map((item) => ({
        name: item.description,
        quantity: item.quantity,
        amount: (item.amount_total ? item.amount_total / 100 : 0).toFixed(2),
      })) ?? [],
    orderDate: new Date(checkoutSession.created * 1000).toLocaleDateString(),
    orderId: checkoutSession.id,
  };

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
