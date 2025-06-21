"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import type {
  BillingData,
  BillingFilters as BillingFiltersType,
  BillingSortBy,
} from "./types";
import { api } from "~/trpc/react";
import { Pagination } from "../../_components/Pagination";
import { useDebounce } from "../../../../hooks/useDebounce";
import { BillingFilters } from "./_components/BillingFilters";
import { BillingTable } from "./_components/BillingTable";
import { KpiCard } from "./_components/KpiCard";

export default function BillingPage() {
  // Sorting state
  const [sortBy, setSortBy] = useState<BillingSortBy>("new_to_old_billing");

  // Filters state
  const [filters, setFilters] = useState<BillingFiltersType>({});
  const debouncedFilters = useDebounce(filters, 300);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Fetch billing data with comprehensive filters and sorting
  const {
    data: billingsData,
    isLoading: billingsLoading,
    error: billingsError,
  } = api.billing.getAllBillings.useQuery(
    {
      limit,
      page,
      sortBy,
      filters: debouncedFilters,
    },
    {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  );

  // Fetch outstanding invoices sum - only after billing data is loaded
  const {
    data: outstandingData,
    isLoading: outstandingLoading,
    error: outstandingError,
  } = api.billing.getOutstandingInvoicesSum.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!billingsData, // Only run after billing data is loaded
  });

  // Fetch subscription data - only after billing data is loaded
  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = api.subscription.getAllSubscriptions.useQuery(
    { timeframe: "7d" },
    {
      retry: false,
      refetchOnWindowFocus: false,
      enabled: !!billingsData, // Only run after billing data is loaded
    },
  );

  console.log(subscriptionData);

  // generate total revenue from billing data directly
  const totalRevenue = useMemo(() => {
    if (!billingsData?.data) return 0;
    return billingsData.data.reduce(
      (acc, billing) => acc + Number(billing.amount),
      0,
    );
  }, [billingsData?.data]);

  // get outstanding count directly from billing data
  const outstandingCount = useMemo(() => {
    if (!billingsData?.data) return 0;
    return billingsData.data.filter(
      (billing) => billing.status === "unpaid" || billing.status === "past_due",
    ).length;
  }, [billingsData?.data]);

  // Monthly recurring and new subs 30-day would require subscription data
  const monthlyRecurring = 0;
  const newSubs30Day = 0;

  // Combined loading state
  const isPageLoading =
    billingsLoading ||
    (billingsData && outstandingLoading) ||
    (billingsData && subscriptionLoading);

  // Combined error state
  const hasError = billingsError ?? outstandingError ?? subscriptionError;

  // Handle filter changes
  const handleFiltersChange = (newFilters: BillingFiltersType) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Handle sorting changes
  const handleSortChange = (newSortBy: BillingSortBy) => {
    setSortBy(newSortBy);
    setPage(1);
  };

  // Download handler for individual invoices
  const handleDownload = (id: string) => {
    const billing = billingsData?.data.find((b: BillingData) => b.id === id);
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
        .map(
          (id) =>
            billingsData?.data.find((b: BillingData) => b.id === id)?.pdfLink,
        )
        .filter((link): link is string => !!link);

      if (pdfLinks.length === 0) {
        toast.error("No PDFs available for selected invoices");
        return;
      }

      // Download with delay to avoid overwhelming the browser
      for (const link of pdfLinks) {
        const linkElement = document.createElement("a");
        linkElement.href = link;
        linkElement.target = "_blank";
        linkElement.click();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      toast.success(`Downloaded ${pdfLinks.length} invoices`);
    } catch (error) {
      toast.error("Error downloading invoices");
      console.error("Bulk download error:", error);
    }
  };

  const total = billingsData?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  if (hasError) {
    const errorMessage =
      billingsError?.message ??
      outstandingError?.message ??
      subscriptionError?.message ??
      "An error occurred while loading billing data";

    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <div className="text-lg font-semibold text-red-500">
          Error loading billing data
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {errorMessage}
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setFilters({});
            setPage(1);
          }}
        >
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-5 min-h-screen w-full bg-gray-50/50 p-4 dark:bg-slate-900/50 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-slate-50 sm:mb-8 sm:text-3xl">
          Billing Management
        </h1>

        <div className="relative">
          {isPageLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-gray-900/60">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-slate-400" />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* KPI Cards */}
            <div className="col-span-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              <KpiCard
                title="Total Revenue"
                value={
                  billingsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-slate-400" />
                  ) : (
                    `$${totalRevenue.toLocaleString()}`
                  )
                }
                className="border-gray-200 bg-white dark:!border-gray-700 dark:bg-gray-800"
              />
              <KpiCard
                title="Monthly Recurring"
                value={`$${monthlyRecurring.toLocaleString()}`}
                className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              />
              <KpiCard
                title="Outstanding AR"
                value={
                  outstandingLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-slate-400" />
                  ) : (
                    `$${outstandingData?.data.toLocaleString()}`
                  )
                }
                className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              />
              <KpiCard
                title="# Outstanding"
                value={
                  billingsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-slate-400" />
                  ) : (
                    outstandingCount.toString()
                  )
                }
                className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              />
              <KpiCard
                title="New Subs 30-Day"
                value={newSubs30Day}
                className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            {/* Filters */}
            <div className="col-span-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                    Filters
                  </h2>
                </div>

                <BillingFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />
              </div>
            </div>

            {/* Billing Table */}
            <div className="col-span-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                    Billing History
                  </h2>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {total} total records
                  </div>
                </div>

                <BillingTable
                  billings={billingsData?.data ?? []}
                  onDownload={handleDownload}
                  onBulkDownload={handleBulkDownload}
                  emptyMessage={
                    !billingsLoading && (billingsData?.data.length ?? 0) === 0
                      ? "No billing data found matching your filters."
                      : undefined
                  }
                  onLoading={billingsLoading}
                  currentSort={sortBy}
                  onSortChange={handleSortChange}
                />

                {/* Pagination Controls */}
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={total}
                  pageSize={limit}
                  onPageChange={setPage}
                  onPageSizeChange={setLimit}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
