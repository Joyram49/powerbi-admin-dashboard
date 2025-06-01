"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Button } from "@acme/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";
import { PricingTierCard } from "./components/PricingTierCard";

type TierId =
  | "data_foundation"
  | "insight_accelerator"
  | "strategic_navigator"
  | "enterprise";

interface SubscriptionState {
  data?: {
    plan: string;
    stripeCustomerId?: string;
  };
}

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<
    string | undefined
  >();
  const {
    data: subscriptionResponse,
    isLoading,
    error,
  } = api.subscription.getCurrentUserCompanySubscription.useQuery(
    { companyId: selectedCompanyId ?? "" },
    { enabled: !!selectedCompanyId },
  );

  const subscriptionState: SubscriptionState = {
    data: subscriptionResponse?.data
      ? {
          plan: subscriptionResponse.data.plan,
          stripeCustomerId:
            subscriptionResponse.data.stripeCustomerId ?? undefined,
        }
      : undefined,
  };

  // Enterprise tier custom amounts (only for testing)
  const [customAmount, setCustomAmount] = useState(1000 * 100); // $1000 in cents
  const [customSetupFee, setCustomSetupFee] = useState(5000 * 100); // $5000 in cents
  const router = useRouter();

  // Get all companies
  const { data: companiesData, isLoading: companiesLoading } =
    api.company.getAllCompanies.useQuery(
      {
        limit: 100, // Get all companies for the dropdown
        sortBy: "companyName",
      },
      {
        retry: false,
      },
    );

  console.log("Companies Data:", companiesData);

  const lastToastCompanyId = useRef<string | undefined>();

  // Create checkout session mutation
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

  const createPortal = api.stripe.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error("Error creating portal session:", error);
      toast.error(error.message || "Error creating portal session");
      setLoading(null);
    },
  });

  const handleSubscribe =  (tierId: TierId) => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    if (!selectedCompanyId) {
      toast.error("Please select a company");
      return;
    }

    setLoading(tierId);

    createCheckout.mutate({
      tier: tierId,
      customerEmail: email,
      companyId: selectedCompanyId,
      ...(tierId === "enterprise" ? { customAmount, customSetupFee } : {}),
    });
  };

  const handleManageSubscription =  (_formData: FormData) => {
    if (!selectedCompanyId) {
      toast.error("Please select a company");
      return;
    }

    setLoading("manage");

    createPortal.mutate({
      companyId: selectedCompanyId,
    });
  };

  const renderSubscriptionContent = () => {
    if (isLoading) {
      return (
        <div className="mb-6 flex items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-950/50 dark:to-indigo-950/50">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-blue-600 dark:text-blue-400">
            Loading subscription...
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400">
            {error.message}
          </AlertDescription>
        </Alert>
      );
    }

    if (!subscriptionResponse?.data && selectedCompanyId) {
      if (lastToastCompanyId.current !== selectedCompanyId) {
        toast.info("No active subscription found for this company", {
          id: "no-subscription",
        });
        lastToastCompanyId.current = selectedCompanyId;
      }
      return null;
    }

    if (
      subscriptionResponse?.data &&
      lastToastCompanyId.current === selectedCompanyId
    ) {
      lastToastCompanyId.current = undefined;
    }

    if (!subscriptionResponse?.data?.id) return null;

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
                  {subscriptionResponse.data.plan}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Status
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {subscriptionResponse.data.status}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Amount
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  ${subscriptionResponse.data.amount}/month
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Next Billing Date
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {new Date(
                    subscriptionResponse.data.currentPeriodEnd,
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form action={handleManageSubscription} className="mb-6 flex gap-4">
          <Button
            type="submit"
            disabled={
              loading === "manage" || !subscriptionState.data?.stripeCustomerId
            }
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_40%)] hover:from-blue-700 hover:to-indigo-700 hover:[text-shadow:none] dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
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
          <Button
            type="button"
            onClick={() => router.push("/super-admin/billing/manage")}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_40%)] hover:from-green-700 hover:to-emerald-700 hover:[text-shadow:none] dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600"
          >
            Upgrade Subscription
          </Button>
        </form>
      </>
    );
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
        <div className="my-4">
          <Select
            value={selectedCompanyId}
            onValueChange={(value) => {
              if (value === "") {
                setSelectedCompanyId(undefined);
              } else {
                setSelectedCompanyId(value);
              }
            }}
            disabled={companiesLoading}
          >
            <SelectTrigger className="w-full border-gray-200 bg-white text-gray-900 ring-offset-white focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-50 dark:ring-offset-gray-800 dark:focus:ring-gray-600">
              {companiesLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading companies...</span>
                </div>
              ) : (
                <SelectValue placeholder="Select a company" />
              )}
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              {companiesData?.success &&
              Array.isArray(companiesData.data) &&
              companiesData.data.length > 0 ? (
                companiesData.data.map((company) => (
                  <SelectItem
                    key={company.id}
                    value={company.id}
                    className="text-gray-900 focus:bg-gray-100 focus:text-gray-900 dark:text-slate-50 dark:focus:bg-gray-700 dark:focus:text-slate-50"
                  >
                    {company.companyName}
                  </SelectItem>
                ))
              ) : (
                <SelectItem
                  value="no-companies"
                  disabled
                  className="text-gray-500 dark:text-gray-400"
                >
                  {companiesLoading
                    ? "Loading companies..."
                    : "No companies available"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => {
          const currentPlan = subscriptionState.data?.plan.toLowerCase() ?? "";
          const isActive = currentPlan === tier.name.toLowerCase();
          return (
            <PricingTierCard
              key={tier.id}
              tier={tier}
              isActive={isActive}
              onSubscribe={handleSubscribe}
              loading={loading}
              selectedCompanyId={selectedCompanyId}
            />
          );
        })}
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
