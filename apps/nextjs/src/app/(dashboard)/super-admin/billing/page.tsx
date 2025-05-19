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
        <div className="mb-6 flex items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-950/50 dark:to-indigo-950/50">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-700 dark:text-gray-300">
            Loading subscription details...
          </p>
        </div>
      );
    }

    if (subscriptionState.error) {
      return (
        <Alert
          variant="destructive"
          className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50"
        >
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-300">
            Error
          </AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400">
            {subscriptionState.error}
          </AlertDescription>
        </Alert>
      );
    }

    if (!subscriptionState.data?.id) {
      return (
        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-300">
            No Active Subscription
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            You don't have an active subscription. Please choose a plan below to
            get started.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <div className="mb-6">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Current Subscription
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {subscriptionState.data.plan}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Status
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {subscriptionState.data.status}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Amount
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  ${subscriptionState.data.amount}/month
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Next Billing Date
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {new Date(
                    subscriptionState.data.currentPeriodEnd,
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form action={handleManageSubscription} className="mb-6">
          <Button
            type="submit"
            disabled={
              loading === "manage" || !subscriptionState.data.stripeCustomerId
            }
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
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
    <div className="container mx-auto px-4 py-16">
      {renderSubscriptionContent()}

      <h1 className="mb-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-700 bg-clip-text text-center text-4xl font-bold text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
        Choose Your Plan
      </h1>

      <div className="mx-auto mb-8 max-w-md">
        <label className="mb-2 block bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-sm font-medium text-transparent dark:from-gray-200 dark:to-gray-400">
          Your Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder-gray-500 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-800"
          placeholder="Enter your email"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="group relative rounded-lg from-blue-500 via-purple-500 to-pink-500 p-[2px] transition-all duration-500 hover:bg-gradient-to-l"
          >
            <Card className="relative flex h-full flex-col rounded-lg border-none bg-white transition-all duration-300 hover:shadow-lg dark:bg-gray-800">
              <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                <CardTitle className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-2xl font-bold text-transparent dark:from-gray-100 dark:to-gray-300">
                  {tier.name}
                </CardTitle>
                <CardDescription className="mt-2 text-gray-600 dark:text-gray-300">
                  {tier.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow py-6">
                <p className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent dark:from-blue-400 dark:to-purple-400">
                  {tier.price}
                </p>
              </CardContent>
              <CardFooter className="p-6">
                <Button
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-3 font-semibold text-white transition-all duration-300 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700"
                  onClick={() =>
                    handleSubscribe(
                      tier.id as
                        | "data_foundation"
                        | "insight_accelerator"
                        | "strategic_navigator"
                        | "enterprise",
                    )
                  }
                  disabled={loading !== null}
                >
                  {loading === tier.id ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>

      {/* Enterprise custom pricing section */}
      <div className="mt-12 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
        <h2 className="mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-2xl font-semibold text-transparent dark:from-gray-100 dark:to-gray-300">
          Enterprise Custom Pricing (Testing Only)
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-sm font-medium text-transparent dark:from-gray-200 dark:to-gray-400">
              Custom Monthly Amount (in cents)
            </label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder-gray-500 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-800"
            />
          </div>
          <div>
            <label className="mb-2 block bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-sm font-medium text-transparent dark:from-gray-200 dark:to-gray-400">
              Custom Setup Fee (in cents)
            </label>
            <input
              type="number"
              value={customSetupFee}
              onChange={(e) => setCustomSetupFee(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder-gray-500 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
