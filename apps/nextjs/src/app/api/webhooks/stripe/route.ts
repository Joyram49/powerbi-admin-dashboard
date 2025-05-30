import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { stripe } from "@acme/api";
import { billings, db, paymentMethods, subscriptions, users } from "@acme/db";

import { env } from "~/env";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature");

  if (!signature) {
    console.error("No Stripe signature found in request headers");
    return new Response("No signature provided", { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );

    console.log(`Received Stripe webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // Create subscription record
        if (session.subscription && session.metadata?.companyId) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );

          // Update subscription metadata with company ID
          await stripe.subscriptions.update(subscription.id, {
            metadata: {
              companyId: session.metadata.companyId,
              tier: session.metadata.tier ?? "unknown",
            },
          });

          // Generate and store portal URL
          const portalUrl = await getStripePortalUrl(
            session.customer as string,
          );

          await db.insert(subscriptions).values({
            stripeSubscriptionId: subscription.id,
            companyId: session.metadata.companyId,
            stripeCustomerId: session.customer as string,
            plan: session.metadata.tier ?? "unknown",
            amount: (
              subscription.items.data[0]?.price?.unit_amount / 100
            ).toFixed(2),
            billingInterval:
              subscription.items.data[0]?.price?.recurring?.interval === "month"
                ? "monthly"
                : "yearly",
            status: subscription.status,
            userLimit: getPlanUserLimit(session.metadata.tier ?? "unknown"),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            stripePortalUrl: portalUrl,
          });
        } else {
          console.error(
            "Missing subscription or companyId in session metadata",
          );
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;

        // Get product information from either the line items or the subscription
        let productName = "Unknown Plan";
        if (invoice.lines.data[0]?.plan?.product) {
          const productId = invoice.lines.data[0].plan.product;
          const product = await stripe.products.retrieve(productId as string);
          productName = product.name;
        } else if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string,
          );
          productName = subscription.metadata.tier ?? "Unknown Plan";
        }

        if (invoice.subscription && invoice.customer) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string,
          );

          // Get company ID from subscription metadata
          const companyId = subscription.metadata.companyId;
          if (!companyId) {
            console.error("No company ID found in subscription metadata");
            break;
          }

          // Check if billing record already exists
          const existingBilling = await db.query.billings.findFirst({
            where: eq(billings.stripeInvoiceId, invoice.id),
          });

          if (existingBilling) {
            // Update existing record
            await db
              .update(billings)
              .set({
                status: "paid",
                amount: (invoice.amount_paid / 100).toString(),
                paymentStatus: "paid",
                updatedAt: new Date(),
              })
              .where(eq(billings.stripeInvoiceId, invoice.id));
          } else {
            // Create new billing record
            await db.insert(billings).values({
              stripeInvoiceId: invoice.id,
              companyId,
              stripeCustomerId: invoice.customer as string,
              billingDate: new Date(invoice.created * 1000),
              status: "paid",
              amount: (invoice.amount_paid / 100).toString(),
              plan: productName,
              pdfLink: invoice.invoice_pdf,
              paymentStatus: "paid",
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;

        if (invoice.subscription && invoice.customer) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string,
          );

          const companyId = subscription.metadata.companyId;
          if (!companyId) {
            console.error("No company ID found in subscription metadata");
            break;
          }

          // Create billing record for failed payment
          await db.insert(billings).values({
            stripeInvoiceId: invoice.id,
            companyId,
            stripeCustomerId: invoice.customer as string,
            billingDate: new Date(invoice.created * 1000),
            status: "failed",
            amount: (invoice.amount_due / 100).toString(),
            plan: subscription.metadata.tier ?? "Unknown Plan",
            pdfLink: invoice.invoice_pdf,
            paymentStatus: "failed",
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        if (subscription.customer) {
          await db
            .delete(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

          const companyId = subscription.metadata.companyId;
          if (!companyId) {
            console.error("No company ID found in subscription metadata");
            break;
          }

          await db
            .update(users)
            .set({
              status: "inactive",
            })
            .where(eq(users.companyId, companyId));
        }
        break;
      }

      case "customer.subscription.paused": {
        const subscription = event.data.object;
        console.log("paused subscription", subscription);
        break;
      }

      case "customer.subscription.resumed": {
        const subscription = event.data.object;
        console.log("resumed subscription", subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const productId = subscription.items.data[0]?.plan.product;
        const product = await stripe.products.retrieve(productId as string);

        if (subscription.customer) {
          const portalUrl = await getStripePortalUrl(
            subscription.customer as string,
          );
          const companyId = subscription.metadata.companyId;

          if (!companyId) {
            console.error("No company ID found in subscription metadata");
            break;
          }

          // Get the previous subscription data to check if plan changed
          const previousSubscription = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, subscription.id),
          });

          switch (subscription.status) {
            case "past_due":
              // First payment failure - update status but keep subscription
              // Stripe will automatically retry 3 more times over ~15 days
              await db
                .update(subscriptions)
                .set({
                  status: subscription.status,
                  currentPeriodEnd: new Date(
                    subscription.current_period_end * 1000,
                  ),
                  amount: (
                    subscription.items.data[0]?.price?.unit_amount / 100
                  ).toFixed(2),
                  plan: product.name,
                  userLimit: getPlanUserLimit(product.name),
                  updatedAt: new Date(),
                  stripePortalUrl: portalUrl,
                })
                .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

              // You might want to notify the company about the payment issue
              // and that they have ~15 days to resolve it
              break;

            case "unpaid":
              // All payment retries failed (after ~15 days of attempts)
              // Delete subscription and deactivate company
              await db
                .delete(subscriptions)
                .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

              // Deactivate company and users
              await db
                .update(users)
                .set({
                  status: "inactive",
                })
                .where(eq(users.companyId, companyId));
              break;

            case "active":
            case "trialing": {
              // Check if plan has changed
              const isPlanChanged = previousSubscription?.plan !== product.name;

              // Update subscription with new details
              await db
                .update(subscriptions)
                .set({
                  status: subscription.status,
                  currentPeriodEnd: new Date(
                    subscription.current_period_end * 1000,
                  ),
                  amount: (
                    subscription.items.data[0]?.price?.unit_amount / 100
                  ).toFixed(2),
                  plan: product.name,
                  userLimit: getPlanUserLimit(product.name),
                  updatedAt: new Date(),
                  stripePortalUrl: portalUrl,
                })
                .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

              if (isPlanChanged) {
                console.log(
                  `Plan changed for company ${companyId} from ${previousSubscription?.plan} to ${product.name}`,
                );
              }
              break;
            }

            case "canceled":
              // Voluntary cancellation - delete subscription
              await db
                .delete(subscriptions)
                .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

              // Deactivate company and users
              await db
                .update(users)
                .set({
                  status: "inactive",
                })
                .where(eq(users.companyId, companyId));
              break;
          }
        }
        break;
      }

      case "payment_method.attached": {
        const paymentMethod = event.data.object;

        if (paymentMethod.customer) {
          // Get the customer's subscriptions to find the company ID
          const subscriptions = await stripe.subscriptions.list({
            customer: paymentMethod.customer as string,
            limit: 1,
          });

          if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];
            if (!subscription) {
              console.error("No subscription found in data");
              break;
            }

            const companyId = subscription.metadata.companyId;
            if (!companyId) {
              console.error("No company ID found in subscription metadata");
              break;
            }

            await db.insert(paymentMethods).values({
              stripePaymentMethodId: paymentMethod.id,
              companyId,
              stripeCustomerId: paymentMethod.customer as string,
              paymentMethodType: paymentMethod.type,
              last4: paymentMethod.card?.last4,
              expMonth: paymentMethod.card?.exp_month,
              expYear: paymentMethod.card?.exp_year,
              isDefault: true,
            });
          } else {
            console.error("No subscription found for customer");
          }
        }
        break;
      }

      default: {
        console.log(`Unhandled event type: ${event.type}`);
      }
    }

    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown Error"}`,
      { status: 400 },
    );
  }
}

function getPlanUserLimit(tier: string): number {
  switch (tier) {
    case "Data Foundation":
      return 2;
    case "Insight Accelerator":
      return 6;
    case "Strategic Navigator":
      return 10;
    default:
      return 2;
  }
}

async function getStripePortalUrl(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/billing`,
  });
  return session.url;
}
