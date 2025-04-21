import { headers } from "next/headers";

import { stripe } from "@acme/api";

import { env } from "~/env";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature");

  if (!signature) {
    return new Response("No signature provided", { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        console.log("checkout.session.completed");
        // Handle successful payment
        break;
      case "customer.subscription.updated":
        console.log("customer.subscription.updated");
        // Handle subscription changes
        break;
      // Add more event handlers as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(null, { status: 200 });
  } catch (err) {
    return new Response(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown Error"}`,
      { status: 400 },
    );
  }
}
