"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

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
import { KpiCard } from "./_components/KpiCard";
import { TransactionFilter } from "./_components/TransactionFilter";
import { TransactionsTable } from "./_components/TransactionsTable";

export default function BillingPage() {
  const [dateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<
    string | undefined
  >(undefined);
  const [dateFilter, setDateFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("all");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);

  // Fetch all companies
  const { data: companiesData, isLoading: companiesLoading } =
    api.company.getAllCompanies.useQuery(
      {
        limit: 100,
        sortBy: "companyName",
      },
      {
        enabled: true,
      },
    );

  const companies = useMemo(
    () => companiesData?.data ?? [],
    [companiesData?.data],
  );

  // Fetch all billings for the company
  const {
    data: billings,
    isLoading: billingsLoading,
    error: billingsError,
  } = api.billing.getCompanyBillings.useQuery(
    {
      companyId: selectedCompanyId ?? "",
    },
    {
      enabled: !!selectedCompanyId && selectedCompanyId !== "",
    },
  );

  // Fetch billings by date range
  const { data: dateRangeBillings, error: dateRangeError } =
    api.billing.getBillingsByDateRange.useQuery(
      {
        companyId: selectedCompanyId ?? "",
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
      {
        enabled: !!selectedCompanyId && selectedCompanyId !== "",
      },
    );

  // Fetch billings by status
  const { data: statusBillings, error: statusError } =
    api.billing.getBillingsByStatus.useQuery(
      {
        companyId: selectedCompanyId ?? "",
        status: "outstanding",
      },
      {
        enabled: !!selectedCompanyId && selectedCompanyId !== "",
      },
    );

  // Fetch current active subscription
  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = api.subscription.getCurrentUserCompanySubscription.useQuery(
    {
      companyId: selectedCompanyId ?? "",
    },
    {
      enabled: !!selectedCompanyId && selectedCompanyId !== "",
    },
  );

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

  // Filter invoices based on date, company, and KPI filter
  const filteredInvoices = useMemo(() => {
    const invoices =
      billings?.map((b) => ({
        id: b.id,
        date: format(new Date(b.billingDate), "MMM dd, yyyy"),
        status: b.status,
        amount: Number(b.amount),
        plan: b.plan,
        paymentStatus: b.paymentStatus,
        companyName:
          companies.find((c) => c.id === selectedCompanyId)?.companyName ?? "",
        pdfUrl: b.pdfLink ?? "",
      })) ?? [];

    return invoices.filter((invoice) => {
      const matchesCompany = invoice.companyName
        .toLowerCase()
        .includes(companyFilter.toLowerCase());

      const invoiceDate = new Date(invoice.date);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "30" && daysDiff <= 30) ||
        (dateFilter === "90" && daysDiff <= 90);

      // Apply KPI filter
      const matchesKpiFilter = !kpiFilter || invoice.status === kpiFilter;

      return matchesCompany && matchesDate && matchesKpiFilter;
    });
  }, [
    billings,
    companies,
    selectedCompanyId,
    companyFilter,
    dateFilter,
    kpiFilter,
  ]);

  // Handle KPI card filter changes
  const handleKpiFilterChange = (filter: string) => {
    setKpiFilter(filter);
    // Reset other filters when KPI filter is applied
    setDateFilter("all");
    setCompanyFilter("");
  };

  // Download handler for individual invoices
  const handleDownload = (id: string) => {
    const billing = billings?.find((b) => b.id === id);
    if (billing?.pdfLink) {
      window.open(billing.pdfLink, "_blank");
    } else {
      toast.error("No PDF available for this invoice");
    }
  };

  // Handle bulk download
  const handleBulkDownload = async (ids: string[]) => {
    try {
      // Get all valid PDF links
      const pdfLinks = ids
        .map((id) => billings?.find((b) => b.id === id)?.pdfLink)
        .filter((link): link is string => !!link);

      if (pdfLinks.length === 0) {
        toast.error("No PDFs available for selected invoices");
        return;
      }

      // Create a download queue
      const downloadQueue = async () => {
        for (const link of pdfLinks) {
          // Create a temporary link element
          const linkElement = document.createElement("a");
          linkElement.href = link;
          linkElement.target = "_blank";
          linkElement.click();

          // Wait for 1 second before next download
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      };

      // Start the download queue
      await downloadQueue();
    } catch (error) {
      toast.error("Error downloading invoices");
      console.error("Bulk download error:", error);
    }
  };

  if (billingsLoading || subscriptionLoading) {
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
            "Please try selecting a different company or try again later"}
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setSelectedCompanyId(undefined);
          }}
        >
          Clear Selection
        </Button>
      </div>
    );
  }

  const hasNoData =
    !selectedCompanyId || (!billings?.length && !subscriptionData?.data);

  return (
    <div className="mt-5 min-h-screen w-full bg-gray-50/50 p-4 dark:bg-slate-900/50 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-slate-50 sm:mb-8 sm:text-3xl">
          Billing Management
        </h1>
        <div className="mb-4">
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
            <SelectContent className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              {companies.length > 0 ? (
                companies.map((company) => (
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
                  No companies available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {hasNoData ? (
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <div className="text-lg font-semibold text-gray-900 dark:text-slate-50">
              {!selectedCompanyId
                ? "Please select a company"
                : "No Billing Data Available"}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {!selectedCompanyId
                ? "Select a company to view its billing information"
                : "This company has no billing history or active subscription"}
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
                onFilterChange={handleKpiFilterChange}
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
                onFilterChange={handleKpiFilterChange}
              />
              <KpiCard
                title="# Outstanding"
                value={outstandingCount}
                className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                onFilterChange={handleKpiFilterChange}
              />
              <KpiCard
                title="New Subs 30-Day"
                value={newSubs30Day}
                className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                onFilterChange={handleKpiFilterChange}
              />
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
                  {kpiFilter && (
                    <div className="flex text-sm items-center gap-2">
                      <span className=" text-gray-500">
                        Filtered by:
                      </span>
                      <span className="text-gray-500 dark:text-white">
                        {kpiFilter.charAt(0).toUpperCase() + kpiFilter.slice(1)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setKpiFilter(null)}
                        className="border text-gray-500 hover:text-gray-700 dark:border-blue-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                      >
                        Clear Filter
                      </Button>
                    </div>
                  )}
                </div>
                <BillingTable
                  invoices={filteredInvoices}
                  onDownload={handleDownload}
                  onBulkDownload={handleBulkDownload}
                  onCompanyFilter={setCompanyFilter}
                  onDateFilter={setDateFilter}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
