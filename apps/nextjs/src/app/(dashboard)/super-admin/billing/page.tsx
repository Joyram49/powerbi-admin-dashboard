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

  // Download state
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch billing data
  const {
    data: billingsData,
    isLoading: billingsLoading,
    error: billingsError,
  } = api.billing.getAllBillings.useQuery({
    limit,
    page,
    sortBy,
    filters: debouncedFilters,
  });

  // Fetch outstanding invoices sum
  const {
    data: outstandingData,
    isLoading: outstandingLoading,
    error: outstandingError,
  } = api.billing.getOutstandingInvoicesSum.useQuery();

  // Fetch subscription data
  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = api.subscription.getAllSubscriptions.useQuery({ timeframe: "7d" });

  // Calculate metrics from data
  const totalRevenue = useMemo(() => {
    return (
      billingsData?.data.reduce(
        (acc, billing) => acc + Number(billing.amount),
        0,
      ) ?? 0
    );
  }, [billingsData?.data]);

  const outstandingCount = useMemo(() => {
    return (
      billingsData?.data.filter(
        (billing) =>
          billing.status === "unpaid" || billing.status === "past_due",
      ).length ?? 0
    );
  }, [billingsData?.data]);

  const monthlyRecurring = useMemo(() => {
    return (
      subscriptionData?.data.subscriptions.reduce(
        (acc, sub) => acc + Number(sub.amount),
        0,
      ) ?? 0
    );
  }, [subscriptionData?.data.subscriptions]);

  const newSubs30Day = useMemo(() => {
    return (
      subscriptionData?.data.subscriptions.filter((sub) => {
        const createdAt = new Date(sub.dateCreated);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdAt >= thirtyDaysAgo;
      }).length ?? 0
    );
  }, [subscriptionData?.data.subscriptions]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: BillingFiltersType) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Handle clearing filters
  const handleClearFilters = () => {
    setFilters({});
    setPage(1);
  };

  // Handle sorting changes
  const handleSortChange = (newSortBy: BillingSortBy) => {
    setSortBy(newSortBy);
    setPage(1);
  };

  // Check if filters have any values
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== "";
    });
  }, [filters]);

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
    setIsDownloading(true);
    try {
      const pdfLinks = ids
        .map(
          (id) =>
            billingsData?.data.find((b: BillingData) => b.id === id)?.pdfLink,
        )
        .filter((link): link is string => !!link);
      if (pdfLinks.length === 0) {
        toast.error("No PDFs available for selected invoices");
        setIsDownloading(false);
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
      setIsDownloading(false);
    } catch (error) {
      toast.error("Error downloading invoices");
      console.error("Bulk download error:", error);
      setIsDownloading(false);
    }
  };

  const total = billingsData?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  if (billingsError || outstandingError || subscriptionError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <div className="text-lg font-semibold text-red-500">
          Error loading billing data
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Please try refreshing the page
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 min-h-screen w-full bg-gray-50/50 p-4 dark:bg-slate-900/50 sm:p-6">
      <div className="mx-auto">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-slate-50 sm:mb-8 sm:text-3xl">
          Billing Management
        </h1>

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
              value={
                subscriptionLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-slate-400" />
                ) : (
                  `$${monthlyRecurring.toLocaleString()}`
                )
              }
              className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              subscriptionData={subscriptionData}
            />
            <KpiCard
              title="Outstanding AR"
              value={
                outstandingLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-slate-400" />
                ) : (
                  `$${outstandingData?.data.toLocaleString() ?? 0}`
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
              value={
                subscriptionLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-slate-400" />
                ) : (
                  newSubs30Day
                )
              }
              className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div className="col-span-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              {/* Filters - Only show when there are active filters */}
              {hasActiveFilters && (
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                    Filters
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-xs"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}

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
                  !billingsLoading && !billingsData?.data.length
                    ? "No billing data found matching your filters."
                    : undefined
                }
                onLoading={billingsLoading}
                isDownloading={isDownloading}
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
  );
}
