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
      alert("Please enter your email");
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
    <div className="container mx-auto py-10">
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
                {loading === tier.id ? "Loading..." : "Subscribe"}
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
