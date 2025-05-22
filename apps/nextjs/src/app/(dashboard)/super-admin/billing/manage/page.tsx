"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import type { Billing } from "@acme/db/schema";

import { api } from "~/trpc/react";
import { BillingTable } from "../_components/BillingTable";
import { DownloadButton } from "../_components/DownloadButton";
import { FundsInAccount } from "../_components/FundsInAccount";
import { KpiCard } from "../_components/KpiCard";
import { MonthlyEarnings } from "../_components/MonthlyEarnings";
import { PageLayoutContainer } from "../_components/PageLayoutContainer";
import { SalesOverviewChart } from "../_components/SalesOverviewChart";
import { TransactionFilter } from "../_components/TransactionFilter";
import { TransactionsTable } from "../_components/TransactionsTable";

const COMPANY_ID = "YOUR_COMPANY_ID"; // Replace with actual company ID

// Add these type definitions at the top of the file after imports
interface ChartDataPoint {
  date: string;
  amount: number;
}

interface SalesOverviewChartProps {
  data: ChartDataPoint[];
  children?: React.ReactNode;
}

interface MonthlyEarningsProps {
  data: ChartDataPoint[];
  percentageChange: number;
  children?: React.ReactNode;
}

export default function ManageBillingPage() {
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
  });

  // Fetch all billings for the company
  const { data: billings, isLoading: billingsLoading } =
    api.billing.getCompanyBillings.useQuery({
      companyId: COMPANY_ID,
    });

  // Fetch billings by date range
  const { data: dateRangeBillings } =
    api.billing.getBillingsByDateRange.useQuery({
      companyId: COMPANY_ID,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

  // Fetch billings by status
  const { data: statusBillings } = api.billing.getBillingsByStatus.useQuery({
    companyId: COMPANY_ID,
    status: "outstanding",
  });

  // Fetch current active subscription
  const { data: subscriptionData, isLoading: subscriptionLoading } =
    api.subscription.getCurrentUserCompanySubscription.useQuery({
      companyId: COMPANY_ID,
    });

  // Example: Filter for transactions
  const [transactionStatus, setTransactionStatus] = useState("all");

  // KPI calculations
  const totalRevenue =
    billings?.reduce((sum, b) => sum + Number(b.amount), 0) ?? 0;
  const outstandingAR =
    statusBillings?.reduce((sum, b) => sum + Number(b.amount), 0) ?? 0;
  const outstandingCount = statusBillings?.length ?? 0;
  const monthlyRecurring = subscriptionData?.data?.amount ?? 0;
  const newSubs30Day =
    dateRangeBillings?.filter((b) => b.status === "new").length ?? 0;

  // Prepare data for charts and tables
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

  // Download handler
  const handleDownload = (id: string) => {
    const billing = billings?.find((b) => b.id === id);
    if (billing?.pdfLink) {
      window.open(billing.pdfLink, "_blank");
    } else {
      alert("No PDF available for this invoice");
    }
  };

  if (billingsLoading || subscriptionLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <PageLayoutContainer>
      {/* KPI Cards */}
      <div className="col-span-4 grid grid-cols-1 gap-4 md:grid-cols-5">
        <KpiCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
        />
        <KpiCard title="Monthly Recurring" value={`$${monthlyRecurring}`} />
        <KpiCard title="Outstanding AR" value={`$${outstandingAR}`} />
        <KpiCard title="# Outstanding" value={outstandingCount} />
        <KpiCard title="New Subs 30-Day" value={newSubs30Day} />
      </div>

      {/* Sales Overview Chart */}
      <div className="col-span-4 md:col-span-2">
        <SalesOverviewChart data={salesData} />
      </div>

      {/* Funds In Account */}
      <div className="col-span-2">
        <FundsInAccount amount={totalRevenue} percentage={75} />
      </div>

      {/* Monthly Earnings */}
      <div className="col-span-2">
        <MonthlyEarnings data={earningsData} percentageChange={5} />
      </div>

      {/* Transactions Table */}
      <div className="col-span-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-lg font-semibold">Recent Transactions</span>
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

      {/* Billing Table */}
      <div className="col-span-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-lg font-semibold">Billing History</span>
          <DownloadButton
            onClick={() => handleDownload("all")}
            label="Download All"
          />
        </div>
        <BillingTable invoices={invoices} onDownload={handleDownload} />
      </div>
    </PageLayoutContainer>
  );
}
