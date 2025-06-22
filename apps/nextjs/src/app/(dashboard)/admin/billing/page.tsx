"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { AlertCircle, Loader2 } from "lucide-react";

import type { Billing, Subscription } from "@acme/db";
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
import { BillingTable } from "./_components/BillingTable";
import { PricingTierCard } from "./_components/PricingTierCard";

type TierId =
  | "data_foundation"
  | "insight_accelerator"
  | "strategic_navigator"
  | "enterprise";

interface SubscriptionState {
  data: Subscription | null;
  isLoading: boolean;
  error: string | null;
}

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null | boolean>(null);
  const [email, setEmail] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>();
  const [companyFilter, setCompanyFilter] = useState("");
  const [dateRange, setDateRange] = useState<"all" | "30" | "90">("all");
  const [isChangingCompany, setIsChangingCompany] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: profile } = api.auth.getProfile.useQuery();
  const { data: companiesData, isLoading: companiesLoading } =
    api.company.getCompaniesByAdminId.useQuery(
      {
        companyAdminId: profile?.user?.id ?? "",
        limit: 100,
        sortBy: "companyName",
      },
      {
        retry: false,
        enabled: !!profile?.user?.id,
      },
    );

  // Auto-select first company if available and no company is selected
  useEffect(() => {
    if (
      companiesData?.data &&
      companiesData.data.length > 0 &&
      !selectedCompanyId
    ) {
      const firstCompany = companiesData.data[0];
      if (firstCompany) {
        setSelectedCompanyId(firstCompany.id);
        // Update URL without triggering navigation
        const newUrl = `/admin/billing?companyId=${firstCompany.id}`;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [companiesData?.data, selectedCompanyId]);

  // Handle URL parameters for direct links
  useEffect(() => {
    const companyIdFromUrl = searchParams.get("companyId");
    if (companyIdFromUrl && companiesData?.data) {
      const companyExists = companiesData.data.some(
        (company) => company.id === companyIdFromUrl,
      );
      if (companyExists) {
        setSelectedCompanyId(companyIdFromUrl);
      }
    }
  }, [searchParams, companiesData?.data]);

  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId || !companiesData?.data) return null;
    return companiesData.data.find((c) => c.id === selectedCompanyId);
  }, [selectedCompanyId, companiesData?.data]);

  const {
    data: subscriptionResponse,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = api.subscription.getCurrentUserCompanySubscription.useQuery(
    {
      companyId: selectedCompanyId ?? "",
    },
    {
      enabled: !!selectedCompanyId,
    },
  );

  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (dateRange !== "all") {
    const days = dateRange === "30" ? 30 : 90;
    startDate = startOfDay(subDays(now, days));
    endDate = endOfDay(now);
  }

  const { data: billingData, isLoading: billingsLoading } =
    dateRange === "all"
      ? api.billing.getCompanyBilling.useQuery(
          {
            companyId: selectedCompanyId ?? "",
          },
          {
            enabled: !!selectedCompanyId && selectedCompanyId !== "",
          },
        )
      : api.billing.getBillingsByDateRange.useQuery(
          {
            companyId: selectedCompanyId ?? "",
            startDate: startDate ?? new Date("2025-01-01"),
            endDate: endDate ?? new Date(),
          },
          {
            enabled:
              !!selectedCompanyId &&
              selectedCompanyId !== "" &&
              !!startDate &&
              !!endDate,
          },
        );

  const billings: Billing[] = useMemo(() => {
    if (!billingData) return [];
    if (
      "billingRecords" in billingData &&
      Array.isArray(billingData.billingRecords)
    ) {
      return billingData.billingRecords;
    }
    if (Array.isArray(billingData)) {
      return billingData;
    }
    return [];
  }, [billingData]);

  const subscriptionState: SubscriptionState = {
    data: subscriptionResponse?.data ?? null,
    isLoading: subscriptionLoading,
    error: subscriptionError?.message ?? null,
  };

  const filteredInvoices = useMemo(() => {
    const invoices = billings.map((b: Billing) => ({
      id: b.id,
      date: format(new Date(b.billingDate), "MMM dd, yyyy"),
      status: b.status,
      amount: Number(b.amount),
      plan: b.plan,
      paymentStatus: b.paymentStatus,
      companyName:
        companiesData?.data.find((c) => c.id === selectedCompanyId)
          ?.companyName ?? "",
      pdfUrl: b.pdfLink ?? "",
    }));

    return invoices.filter((invoice: (typeof invoices)[number]) => {
      const matchesCompany = invoice.companyName
        .toLowerCase()
        .includes(companyFilter.toLowerCase());
      return matchesCompany;
    });
  }, [billings, companiesData?.data, selectedCompanyId, companyFilter]);

  const lastToastCompanyId = useRef<string | undefined>();

  const createCheckout = api.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error("Error creating checkout session:", error);
      toast.error(error.message || "Error creating checkout session");
      setLoading(false);
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
      setLoading(false);
    },
  });

  const handleSubscribe = (tierId: TierId) => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    if (!selectedCompanyId) {
      toast.error("Please select a company");
      return;
    }

    setLoading(true);

    createCheckout.mutate({
      tier: tierId,
      customerEmail: email,
      companyId: selectedCompanyId,
    });
  };

  const handleManageSubscription = (_formData: FormData) => {
    if (!selectedCompanyId) {
      toast.error("Please select a company");
      return;
    }

    setLoading(true);

    createPortal.mutate({
      companyId: selectedCompanyId,
    });
  };

  // Download handler for individual invoices
  const handleDownload = (id: string) => {
    const billing = billings.find((b: Billing) => b.id === id);
    if (billing?.pdfLink) {
      window.open(billing.pdfLink, "_blank");
    } else {
      toast.error("No PDF available for this invoice");
    }
  };

  // Handle bulk download
  const handleBulkDownload = async (ids: string[]) => {
    try {
      const pdfLinks = ids
        .map((id) => billings.find((b: Billing) => b.id === id)?.pdfLink)
        .filter((link): link is string => !!link);

      if (pdfLinks.length === 0) {
        toast.error("No PDFs available for selected invoices");
        return;
      }

      const downloadQueue = async () => {
        for (const link of pdfLinks) {
          const linkElement = document.createElement("a");
          linkElement.href = link;
          linkElement.target = "_blank";
          linkElement.click();
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      };

      await downloadQueue();
    } catch (error) {
      toast.error("Error downloading invoices");
      console.error("Bulk download error:", error);
    }
  };

  const hasPreferredPlan = selectedCompany?.preferredSubscriptionPlan;

  // Show loading state while companies are loading
  if (companiesLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-950/50 dark:to-indigo-950/50">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-700 dark:text-gray-300">
            Loading your companies...
          </p>
        </div>
      </div>
    );
  }

  // Show warning if no companies are available
  if (!companiesData?.data || companiesData.data.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/50">
          <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertTitle className="text-orange-800 dark:text-orange-300">
            No Companies Found
          </AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-400">
            You don't have any companies associated with your account. Please
            contact your administrator to get access to company billing
            information.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show company selector if multiple companies exist
  const showCompanySelector = companiesData.data.length > 1;

  const renderSubscriptionContent = () => {
    if (!selectedCompanyId) {
      return (
        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-300">
            Loading Company Data
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            Please wait while we load the company information...
          </AlertDescription>
        </Alert>
      );
    }

    if (subscriptionLoading || isChangingCompany) {
      return (
        <div className="mb-6 flex items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-950/50 dark:to-indigo-950/50">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-700 dark:text-gray-300">
            {isChangingCompany
              ? "Switching company..."
              : "Loading subscription details..."}
          </p>
        </div>
      );
    }

    if (subscriptionError) {
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

    if (!subscriptionState.data && !hasPreferredPlan && selectedCompanyId) {
      if (lastToastCompanyId.current !== selectedCompanyId) {
        toast.info("No active subscription found for this company", {
          id: "no-subscription-toast",
        });
        lastToastCompanyId.current = selectedCompanyId;
      }
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

    if (
      subscriptionState.data &&
      lastToastCompanyId.current === selectedCompanyId
    ) {
      lastToastCompanyId.current = undefined;
    }

    // If no active subscription but has preferred plan, show preferred plan details
    if (!subscriptionState.data?.id && hasPreferredPlan) {
      const preferredPlan = tiers.find((tier) => tier.id === hasPreferredPlan);

      if (!preferredPlan) return null;

      return (
        <>
          <div className="mb-6">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Preferred Subscription Plan
            </h2>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Plan
                  </p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {preferredPlan.name}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Preferred Plan
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Price
                  </p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {preferredPlan.price}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form action={handleManageSubscription} className="mb-6 flex gap-4">
            <Button
              type="button"
              onClick={() =>
                router.push(
                  `/admin/billing/manage?companyId=${selectedCompanyId}&companyName=${encodeURIComponent(selectedCompany.companyName)}`,
                )
              }
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_40%)] hover:from-green-700 hover:to-emerald-700 hover:[text-shadow:none] dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600"
            >
              Activate Subscription
            </Button>
          </form>
        </>
      );
    }

    if (!subscriptionState.data?.id) return null;

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

        <form action={handleManageSubscription} className="mb-6 flex gap-4">
          <Button
            type="submit"
            disabled={!!loading || !subscriptionState.data.stripeCustomerId}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_40%)] hover:from-blue-700 hover:to-indigo-700 hover:[text-shadow:none] dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
          >
            {loading ? (
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
            onClick={() =>
              router.push(
                `/admin/billing/manage?companyId=${selectedCompanyId}&companyName=${encodeURIComponent(selectedCompany?.companyName ?? "")}`,
              )
            }
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_40%)] hover:from-green-700 hover:to-emerald-700 hover:[text-shadow:none] dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600"
          >
            Upgrade Subscription
          </Button>
        </form>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Billing Table */}
          <div className="col-span-4">
            <div className="relative rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <BillingTable
                invoices={filteredInvoices}
                onDownload={handleDownload}
                onBulkDownload={handleBulkDownload}
                onCompanyFilter={setCompanyFilter}
                loading={billingsLoading}
                onDateFilter={(val) => setDateRange(val as "all" | "30" | "90")}
              />
            </div>
          </div>
        </div>
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
      {/* Company Selector - Only show if multiple companies exist */}
      {showCompanySelector && (
        <div className="mb-8">
          <div className="mx-auto max-w-lg">
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Select Company
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Choose a company to view its billing information
              </p>
            </div>
            <div className="relative">
              <Select
                value={selectedCompanyId}
                onValueChange={(value) => {
                  setIsChangingCompany(true);
                  if (value === "") {
                    setSelectedCompanyId(undefined);
                    router.push("/admin/billing");
                  } else {
                    setSelectedCompanyId(value);
                    router.push(`/admin/billing?companyId=${value}`);
                  }
                  setTimeout(() => {
                    setIsChangingCompany(false);
                  }, 100);
                }}
                disabled={isChangingCompany}
              >
                <SelectTrigger className="h-12 w-full border-2 border-gray-200 bg-white px-4 text-left text-gray-900 shadow-sm transition-all hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-800">
                  {isChangingCompany ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium">
                        Switching company...
                      </span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Select a company to continue" />
                  )}
                </SelectTrigger>
                <SelectContent className="border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {companiesData.success && companiesData.data.length > 0 ? (
                    companiesData.data.map((company) => (
                      <SelectItem
                        key={company.id}
                        value={company.id}
                        className="cursor-pointer px-4 py-3 text-gray-900 transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-900 dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:bg-gray-700 dark:focus:text-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            {company.companyName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {company.companyName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {company.email ?? "No email"}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem
                      value="no-companies"
                      disabled
                      className="px-4 py-3 text-gray-500 dark:text-gray-400"
                    >
                      No companies available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {renderSubscriptionContent()}

      {!subscriptionState.data &&
        !hasPreferredPlan &&
        !isChangingCompany &&
        !subscriptionLoading &&
        !billingsLoading &&
        selectedCompanyId && (
          <>
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
              {tiers.map((tier) => {
                const isActive =
                  subscriptionState.data?.plan.toLowerCase() ===
                  tier.name.toLowerCase();
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
          </>
        )}
    </div>
  );
}
