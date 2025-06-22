"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";
import { PricingTierCard } from "../_components/PricingTierCard";

type TierId =
  | "data_foundation"
  | "insight_accelerator"
  | "strategic_navigator"
  | "enterprise";

const TIER_ORDER: Record<TierId, number> = {
  data_foundation: 1,
  insight_accelerator: 2,
  strategic_navigator: 3,
  enterprise: 4,
};

export default function ManageBillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId");
  const companyName = searchParams.get("companyName");

  const { data: profile } = api.auth.getProfile.useQuery();

  const { data: companyData, isLoading: companyLoading } =
    api.company.getCompanyByCompanyId.useQuery(
      {
        companyId: companyId ?? "",
      },
      {
        enabled: !!companyId,
      },
    );

  const { data: subscriptionResponse, isLoading: subscriptionLoading } =
    api.subscription.getCurrentUserCompanySubscription.useQuery(
      {
        companyId: companyId ?? "",
      },
      {
        enabled: !!companyId,
      },
    );

  // Add effect to handle loading states
  useEffect(() => {
    if (!companyLoading && !subscriptionLoading) {
      setIsLoading(false);
    }
  }, [companyLoading, subscriptionLoading]);

  const createCheckout = api.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error("Error creating checkout session:", error);
      toast.error(error.message || "Error creating checkout session");
      setLoading(null);
    },
  });

  const upgradeSubscription = api.stripe.upgradeSubscription.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Subscription upgrade request received");
        router.push(`/admin/billing?companyId=${companyId}`);
      }
    },
    onError: (error) => {
      console.error("Error upgrading subscription:", error);
      toast.error(error.message || "Error upgrading subscription");
      setLoading(null);
    },
  });

  const handleSubscribe = async (tierId: TierId) => {
    const email = profile?.user?.email;
    if (!email) {
      toast.error("Could not determine your email. Please re-login.");
      return;
    }

    if (!companyId) {
      toast.error("Company ID is missing");
      return;
    }

    setLoading(tierId);

    try {
      if (companyData?.data?.preferredSubscriptionPlan) {
        await createCheckout.mutateAsync({
          tier: companyData.data.preferredSubscriptionPlan as TierId,
          customerEmail: email,
          companyId,
        });
      } else if (subscriptionResponse?.data) {
        await upgradeSubscription.mutateAsync({
          newTier: tierId,
          companyId,
        });
      } else {
        await createCheckout.mutateAsync({
          tier: tierId,
          customerEmail: email,
          companyId,
        });
      }
    } catch (error) {
      console.error("Failed to process subscription:", error);
      setLoading(null);
    }
  };

  const tiers = [
    {
      id: "data_foundation" as const,
      name: "Data Foundation",
      description:
        "For professionals looking for the first step in business data analytics.",
      price: "$200/mo\n$2000 1-Time Setup Fee\n2 Powerview Licenses",
      features: [
        "Foundation Powerview™ Slides",
        "Job Management Report",
        "Jobs Report",
        "Area Review/Compare",
        "Org Aging",
        "Group Onboarding",
        "Email Support: 48hr response",
        "Deal Refreshed Daily",
        "Side Edit Credits",
      ],
      addOns: [
        "Enterprise Slides (Contact Us)",
        "Licenses (Side)",
        "Custom Slides (Contact Us)",
      ],
    },
    {
      id: "insight_accelerator" as const,
      name: "Insight Accelerator",
      description:
        "For movers looking for more advanced insights to justify the next business step.",
      price: "$300/mo\n$3500 1-Time Setup Fee\n6 Powerview Licenses",
      features: [
        "5 Insight Powerview™ Slides",
        "Pro Production",
        "Pro Production Merits",
        "Production by Sold",
        "Team Training Session",
        "Deal Review Insights",
        "Optional Email Support",
        "Side Edit Credits",
      ],
      addOns: [
        "Enterprise Slides ($60/mo)",
        "Licenses ($150/mo)",
        "Custom Slides (Contact Us)",
      ],
    },
    {
      id: "strategic_navigator" as const,
      name: "Strategic Navigator",
      description:
        "For growing businesses that want to empower their colleagues.",
      price: "$600/mo\n$5000 1-Time Setup Fee\n10 Powerview Licenses",
      features: [
        "6 Strategic Powerview™ Slides",
        "Pro Insights",
        "Time Frames",
        "Net Agents – Reports",
        "Team Training – Reports",
        "Enterprise Insights",
        "Detailed Drill Through Feature",
        "Optional Email Support",
        "Email Spam Training Credit",
      ],
      addOns: [
        "Enterprise Slides ($60/mo)",
        "Licenses ($150/mo)",
        "Custom Slides (Contact Us)",
      ],
    },
    {
      id: "enterprise" as const,
      name: "Enterprise",
      description: "For businesses and franchises with more complex needs.",
      price: "Contact us for Pricing\nUnlimited Powerview Licenses",
      features: [
        "8+ Enterprise Powerview™ Slides",
        "All Strategic Navigator Features",
        "Job Management Report",
        "Web App",
        "JMR Conditional Formatting",
        "Priority Photo Support",
        "Weekly Recap Email",
        "Automated Action Manager",
        "Monthly Side Edit Credits",
      ],
      addOns: ["Enterprise Slides (Contact Us)", "Custom Slides (Contact Us)"],
    },
  ];

  const getCurrentTierLevel = (planName: string): number => {
    const tier = tiers.find(
      (t) => t.name.toLowerCase() === planName.toLowerCase(),
    );
    return tier ? TIER_ORDER[tier.id] : 0;
  };

  const filteredTiers = tiers.filter((tier) => {
    if (!subscriptionResponse?.data?.plan) return true;
    const currentTierLevel = getCurrentTierLevel(
      subscriptionResponse.data.plan,
    );
    return TIER_ORDER[tier.id] >= currentTierLevel;
  });

  if (!companyId || !companyName) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert
          variant="destructive"
          className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50"
        >
          <AlertTitle className="text-red-800 dark:text-red-300">
            Missing Company Information
          </AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400">
            Please select a company from the billing page to upgrade your
            subscription.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push("/admin/billing")}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_40%)] hover:from-blue-700 hover:to-indigo-700 hover:[text-shadow:none] dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
        >
          Back to Billing
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="mb-12 text-center text-4xl font-bold">
        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-700 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
          {companyData?.data?.preferredSubscriptionPlan
            ? "ACTIVATE"
            : "UPGRADE"}{" "}
          SUBSCRIPTION FOR{" "}
        </span>
        <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400">
          {companyName.toUpperCase()}
        </span>
      </h1>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {companyData?.data?.preferredSubscriptionPlan ? (
            <PricingTierCard
              key={companyData.data.preferredSubscriptionPlan}
              tier={
                (tiers.find(
                  (t) => t.id === companyData.data?.preferredSubscriptionPlan,
                ) ?? tiers[0]) as {
                  id: TierId;
                  name: string;
                  description: string;
                  price: string;
                  features: string[];
                  addOns: string[];
                }
              }
              isActive={false}
              onSubscribe={handleSubscribe}
              loading={loading}
              selectedCompanyId={companyId}
              isPreferredPlan={true}
              isUpgrade={false}
            />
          ) : (
            filteredTiers.map((tier) => {
              const isActive =
                subscriptionResponse?.data?.plan.toLowerCase() ===
                tier.name.toLowerCase();
              return (
                <PricingTierCard
                  key={tier.id}
                  tier={tier}
                  isActive={isActive}
                  onSubscribe={handleSubscribe}
                  loading={loading}
                  selectedCompanyId={companyId}
                  isPreferredPlan={false}
                  isUpgrade={!!subscriptionResponse?.data}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
