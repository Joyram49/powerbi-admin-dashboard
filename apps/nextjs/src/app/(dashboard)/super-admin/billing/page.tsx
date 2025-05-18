"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

import type { Subscription } from "@acme/db";
import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { api } from "~/trpc/react";

interface SubscriptionState {
  data: Subscription | null;
  isLoading: boolean;
  error: string | null;
}

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>(
    {
      data: null,
      isLoading: true,
      error: null,
    },
  );

  // Enterprise tier custom amounts (only for testing)
  const [customAmount, setCustomAmount] = useState(1000 * 100); // $1000 in cents
  const [customSetupFee, setCustomSetupFee] = useState(5000 * 100); // $5000 in cents

  const router = useRouter();

  // Get current subscription
  const {
    data: subscriptionResponse,
    isSuccess,
    isError,
    error: queryError,
  } = api.subscription.getCurrentUserCompanySubscription.useQuery(
    {
      companyId: "4e6cd650-80e3-4677-9cb8-24452230d854",
    },
    {
      retry: false,
      onError: (error) => {
        setSubscriptionState({
          data: null,
          isLoading: false,
          error: (error as string) || "An error occurred",
        });
      },
    },
  );

  useEffect(() => {
    if (isSuccess && subscriptionResponse.data) {
      setSubscriptionState({
        data: subscriptionResponse.data,
        isLoading: false,
        error: null,
      });
    } else if (isError && queryError.message) {
      setSubscriptionState({
        data: null,
        isLoading: false,
        error:
          queryError.message || "An error occurred while fetching subscription",
      });
    } else {
      setSubscriptionState({
        data: null,
        isLoading: !isSuccess && !isError,
        error: null,
      });
    }
  }, [subscriptionResponse, queryError, isSuccess, isError]);

  // Create checkout session mutation
  const createCheckout = api.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error("Error creating checkout session:", error);
      setLoading(null);
    },
  });

  const handleSubscribe = (
    tier:
      | "data_foundation"
      | "insight_accelerator"
      | "strategic_navigator"
      | "enterprise",
  ) => {
    if (!email) {
      alert("Please enter your email");
      return;
    }

    setLoading(tier);

    createCheckout.mutate({
      tier,
      customerEmail: email,
      companyId: "f640b546-ef23-41d5-b60c-cd06cfbd8b32",
      ...(tier === "enterprise" ? { customAmount, customSetupFee } : {}),
    });
  };

  const handleManageSubscription = (_formData: FormData) => {
    if (!subscriptionState.data?.stripeCustomerId) {
      alert("No active subscription found. Please subscribe to a plan first.");
      return;
    }

    router.push("/super-admin/billing/manage");
  };

  const renderSubscriptionContent = () => {
    if (subscriptionState.isLoading) {
      return (
        <div className="mb-6 flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading subscription details...</p>
        </div>
      );
    }

    if (subscriptionState.error) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{subscriptionState.error}</AlertDescription>
        </Alert>
      );
    }

    if (!subscriptionState.data?.id) {
      return (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Active Subscription</AlertTitle>
          <AlertDescription>
            You don't have an active subscription. Please choose a plan below to
            get started.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold">Current Subscription</h2>
          <div className="rounded-lg border border-gray-200 p-4">
            <p>
              <strong>Plan:</strong> {subscriptionState.data.plan}
            </p>
            <p>
              <strong>Status:</strong> {subscriptionState.data.status}
            </p>
            <p>
              <strong>Amount:</strong> ${subscriptionState.data.amount}/month
            </p>
            <p>
              <strong>Next Billing Date:</strong>{" "}
              {new Date(
                subscriptionState.data.currentPeriodEnd,
              ).toLocaleDateString()}
            </p>
          </div>
        </div>

        <form action={handleManageSubscription} className="mb-6">
          <Button
            type="submit"
            disabled={
              loading === "manage" || !subscriptionState.data.stripeCustomerId
            }
          >
            {loading === "manage" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Manage Subscription"
            )}
          </Button>
        </form>
      </>
    );
  };

  const tiers = [
    {
      id: "data_foundation",
      name: "Data Foundation",
      description: "Essential data management and analytics",
      price: "$200/month + $500 setup fee",
    },
    {
      id: "insight_accelerator",
      name: "Insight Accelerator",
      description: "Advanced analytics and reporting",
      price: "$300/month + $800 setup fee",
    },
    {
      id: "strategic_navigator",
      name: "Strategic Navigator",
      description: "Full analytics suite with strategic insights",
      price: "$600/month + $1,500 setup fee",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Custom solutions for large organizations",
      price: "Custom pricing",
    },
  ];

  return (
    <div className="container mx-auto py-10">
      {renderSubscriptionContent()}

      <h1 className="mb-10 text-center text-3xl font-bold">Choose Your Plan</h1>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium">Your Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2"
          placeholder="Enter your email"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <Card key={tier.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-xl font-bold">{tier.price}</p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleSubscribe(tier.id)}
                disabled={loading !== null}
              >
                {loading === tier.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Subscribe"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Enterprise custom pricing section */}
      <div className="mt-6 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-4 text-xl font-semibold">
          Enterprise Custom Pricing (Testing Only)
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Custom Monthly Amount (in cents)
            </label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 p-2"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              Custom Setup Fee (in cents)
            </label>
            <input
              type="number"
              value={customSetupFee}
              onChange={(e) => setCustomSetupFee(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 p-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
