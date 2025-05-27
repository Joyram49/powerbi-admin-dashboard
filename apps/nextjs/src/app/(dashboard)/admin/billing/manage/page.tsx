"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import { toast } from "@acme/ui/toast";

import { BillingTable } from "~/app/(dashboard)/super-admin/billing/_components/BillingTable";
import { FundsInAccount } from "~/app/(dashboard)/super-admin/billing/_components/FundsInAccount";
import { KpiCard } from "~/app/(dashboard)/super-admin/billing/_components/KpiCard";
import { MonthlyEarnings } from "~/app/(dashboard)/super-admin/billing/_components/MonthlyEarnings";
import { SalesOverviewChart } from "~/app/(dashboard)/super-admin/billing/_components/SalesOverviewChart";
import { TransactionFilter } from "~/app/(dashboard)/super-admin/billing/_components/TransactionFilter";
import { TransactionsTable } from "~/app/(dashboard)/super-admin/billing/_components/TransactionsTable";
import { api } from "~/trpc/react";

export default function ManageBillingPage() {
  const [dateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
  });

  // Get current user session
  const { data: profile } = api.auth.getProfile.useQuery(undefined, {
    enabled: true, // Always fetch profile as it's needed for company data
  });

  // Fetch admin's company
  const { data: adminCompanies, isLoading: adminCompaniesLoading } =
    api.company.getCompaniesByAdminId.useQuery(
      {
        companyAdminId: profile?.user?.id ?? "",
        limit: 1,
        page: 1,
        sortBy: "dateJoined",
      },
      {
        enabled: !!profile?.user?.id,
      },
    );

  const companyId = adminCompanies?.data[0]?.id;

  // Fetch all billings for the company
  const {
    data: billings,
    isLoading: billingsLoading,
    error: billingsError,
  } = api.billing.getCompanyBillings.useQuery(
    {
      companyId: companyId ?? "",
    },
    {
      enabled: !!companyId && !!profile?.user?.id,
    },
  );

  // Fetch billings by date range
  const { data: dateRangeBillings, error: dateRangeError } =
    api.billing.getBillingsByDateRange.useQuery(
      {
        companyId: companyId ?? "",
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
      {
        enabled:
          !!companyId &&
          !!profile?.user?.id &&
          !!dateRange.startDate &&
          !!dateRange.endDate,
      },
    );

  // Fetch billings by status
  const { data: statusBillings, error: statusError } =
    api.billing.getBillingsByStatus.useQuery(
      {
        companyId: companyId ?? "",
        status: "outstanding",
      },
      {
        enabled: !!companyId && !!profile?.user?.id,
      },
    );

  // Fetch current active subscription
  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = api.subscription.getCurrentUserCompanySubscription.useQuery(
    {
      companyId: companyId ?? "",
    },
    {
      enabled: !!companyId && !!profile?.user?.id,
    },
  );

  // Example: Filter for transactions
  const [transactionStatus, setTransactionStatus] = useState("all");

  // Check for any errors
  const hasError =
    billingsError ?? dateRangeError ?? statusError ?? subscriptionError;

  // KPI calculations with null checks
  const totalRevenue =
    billings?.reduce((sum, b) => sum + Number(b.amount), 0) ?? 0;
  const outstandingAR =
    statusBillings?.reduce((sum, b) => sum + Number(b.amount), 0) ?? 0;
  const outstandingCount = statusBillings?.length ?? 0;
  const monthlyRecurring = subscriptionData?.data?.amount ?? 0;
  const newSubs30Day =
    dateRangeBillings?.filter((b) => b.status === "new").length ?? 0;

  // Prepare data for charts and tables with null checks
  const salesData =
    dateRangeBillings?.map((billing) => ({
      date: format(new Date(billing.billingDate), "MMM dd"),
      amount: Number(billing.amount),
    })) ?? [];

  const earningsData =
    dateRangeBillings?.map((billing) => ({
      date: format(new Date(billing.billingDate), "MMM dd"),
      amount: Number(billing.amount),
    })) ?? [];

  // Transactions for table (filter as needed)
  const transactions =
    billings
      ?.filter(
        (b) => transactionStatus === "all" || b.status === transactionStatus,
      )
      .map((b) => ({
        id: b.id,
        date: format(new Date(b.billingDate), "MMM dd, yyyy"),
        description: b.plan,
        status: b.status,
        amount: Number(b.amount),
        paymentStatus: b.paymentStatus,
      })) ?? [];

  // Invoices for billing table
  const invoices =
    billings?.map((b) => ({
      id: b.id,
      date: format(new Date(b.billingDate), "MMM dd, yyyy"),
      status: b.status,
      amount: Number(b.amount),
      plan: b.plan,
      paymentStatus: b.paymentStatus,
      pdfLink: b.pdfLink,
    })) ?? [];

  // Download handler for individual invoices
  const handleDownload = (id: string) => {
    const billing = billings?.find((b) => b.id === id);
    if (billing?.pdfLink) {
      window.open(billing.pdfLink, "_blank");
    } else {
      toast.error("No PDF available for this invoice");
    }
  };

  if (adminCompaniesLoading || billingsLoading || subscriptionLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-slate-400" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <div className="text-lg font-semibold text-red-500">
          Error loading billing data
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {billingsError?.message ??
            dateRangeError?.message ??
            statusError?.message ??
            subscriptionError?.message ??
            "Please try again later"}
        </div>
      </div>
    );
  }

  const hasNoData =
    !companyId || (!billings?.length && !subscriptionData?.data);

  return (
    <div className="mt-5 min-h-screen w-full bg-gray-50/50 p-4 dark:bg-slate-900/50 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-slate-50 sm:mb-8 sm:text-3xl">
          Manage Billing
        </h1>

        {hasNoData ? (
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <div className="text-lg font-semibold text-gray-900 dark:text-slate-50">
              No Billing Data Available
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Your company has no billing history or active subscription
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* KPI Cards */}
            <div className="col-span-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              <KpiCard
                title="Total Revenue"
                value={`$${totalRevenue.toLocaleString()}`}
                className="border-gray-200 bg-white dark:!border-gray-700 dark:bg-gray-800"
              />
              <KpiCard
                title="Monthly Recurring"
                value={`$${monthlyRecurring}`}
                className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              />
              <KpiCard
                title="Outstanding AR"
                value={`$${outstandingAR}`}
                className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              />
              <KpiCard
                title="# Outstanding"
                value={outstandingCount}
                className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              />
              <KpiCard
                title="New Subs 30-Day"
                value={newSubs30Day}
                className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            {/* Sales Overview Chart */}
            <div className="col-span-4 md:col-span-2">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <SalesOverviewChart data={salesData} />
              </div>
            </div>

            {/* Funds In Account */}
            <div className="col-span-4 sm:col-span-2">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <FundsInAccount amount={totalRevenue} percentage={75} />
              </div>
            </div>

            {/* Monthly Earnings */}
            <div className="col-span-4 sm:col-span-2">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <MonthlyEarnings data={earningsData} percentageChange={5} />
              </div>
            </div>

            {/* Transactions Table */}
            <div className="col-span-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                    Recent Transactions
                  </span>
                  <TransactionFilter
                    options={[
                      { label: "All", value: "all" },
                      { label: "Paid", value: "paid" },
                      { label: "Outstanding", value: "outstanding" },
                      { label: "Failed", value: "failed" },
                    ]}
                    value={transactionStatus}
                    onChange={setTransactionStatus}
                  />
                </div>
                <TransactionsTable transactions={transactions} />
              </div>
            </div>

            {/* Billing Table */}
            <div className="col-span-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                    Billing History
                  </span>
                </div>
                <BillingTable invoices={invoices} onDownload={handleDownload} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
