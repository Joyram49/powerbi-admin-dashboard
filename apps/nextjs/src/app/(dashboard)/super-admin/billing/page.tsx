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
    if (ids.length === 0) {
      toast.error("Please select invoices to download");
      return;
    }

    // Get the billing data for selected IDs
    const selectedBillings =
      billingsData?.data.filter((billing) => ids.includes(billing.id)) ?? [];

    if (selectedBillings.length === 0) {
      toast.error("No valid invoices found for download");
      return;
    }

    // Filter out billings without PDF links
    const billingsWithPdf = selectedBillings.filter(
      (billing) => billing.pdfLink,
    );

    if (billingsWithPdf.length === 0) {
      toast.error("No PDFs available for selected invoices");
      return;
    }

    let successCount = 0;
    let cancelledCount = 0;

    // Show initial progress
    toast.info(
      `Starting sequential download of ${billingsWithPdf.length} invoices. Each PDF will open one by one.`,
      { duration: 4000 },
    );

    setIsDownloading(true);

    // Process each PDF sequentially
    for (let i = 0; i < billingsWithPdf.length; i++) {
      const billing = billingsWithPdf[i];
      const pdfUrl = billing.pdfLink!;

      // Show current progress
      toast.info(
        `Opening invoice ${i + 1} of ${billingsWithPdf.length}: ${billing.invoiceId || billing.id}`,
        { duration: 3000 },
      );

      // Open PDF in new window
      const newWindow = window.open(
        pdfUrl,
        "_blank",
        "width=800,height=600,scrollbars=yes",
      );

      if (newWindow) {
        // Wait for user to interact with the PDF window
        // We'll assume the user has completed their action after a reasonable delay
        // and then move to the next PDF
        await new Promise((resolve) => {
          // Check if window is closed or if user has been on the page for a while
          const checkWindow = setInterval(() => {
            if (newWindow.closed) {
              clearInterval(checkWindow);
              resolve(true);
            }
          }, 1000);

          // Also resolve after a reasonable time (30 seconds) to prevent infinite waiting
          setTimeout(() => {
            clearInterval(checkWindow);
            resolve(true);
          }, 30000);
        });

        successCount++;

        // Small delay before opening next PDF
        if (i < billingsWithPdf.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } else {
        // Popup blocked
        toast.error(
          `Popup blocked for invoice ${billing.invoiceId || billing.id}. Please allow popups and try again.`,
          { duration: 5000 },
        );
        cancelledCount++;
      }
    }

    setIsDownloading(false);

    // Show final results
    if (successCount > 0) {
      toast.success(
        `Completed! ${successCount} invoices opened successfully.`,
        { duration: 5000 },
      );
    }

    if (cancelledCount > 0) {
      toast.error(
        `${cancelledCount} invoices could not be opened due to popup blockers.`,
        { duration: 5000 },
      );
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
      <div className="mx-auto max-w-7xl">
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
