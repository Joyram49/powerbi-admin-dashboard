"use client";

import { useState } from "react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  // Enterprise tier custom amounts (only for testing)
  const [customAmount, setCustomAmount] = useState(1000 * 100); // $1000 in cents
  const [customSetupFee, setCustomSetupFee] = useState(5000 * 100); // $5000 in cents

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
      toast.warning("Please enter your email");
      return;
    }

    setLoading(tier);

    createCheckout.mutate({
      tier,
      customerEmail: email,
      ...(tier === "enterprise" ? { customAmount, customSetupFee } : {}),
    });
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
            <Card className="relative flex h-full flex-col border-none rounded-lg bg-white transition-all duration-300 hover:shadow-lg dark:bg-gray-800">
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
