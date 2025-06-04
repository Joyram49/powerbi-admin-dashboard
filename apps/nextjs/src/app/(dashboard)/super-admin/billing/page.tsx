"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { Loader2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";
import { Pagination } from "../../_components/Pagination";
import { useDebounce } from "../../../../hooks/useDebounce";
import { BillingTable } from "./_components/BillingTable";
import { KpiCard } from "./_components/KpiCard";

interface Billing {
  id: string;
  invoiceId?: string;
  billingDate: string | Date;
  amount: number;
  status: string;
  companyName?: string | null;
  pdfLink?: string | null;
  dateCreated?: string | Date;
  updatedAt?: string | Date;
  // ...add other fields as needed
}

export default function BillingPage() {
  const [companyFilter, setCompanyFilter] = useState("");
  const debouncedCompanyFilter = useDebounce(companyFilter, 300);

  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    | "new_to_old_billing"
    | "old_to_new_billing"
    | "high_to_low_amount"
    | "low_to_high_amount"
  >("new_to_old_billing");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [dateRange, setDateRange] = useState<"all" | "30" | "90">("all");

  const router = useRouter();
  const searchParams = useSearchParams();

  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (dateRange !== "all") {
    const days = dateRange === "30" ? 30 : 90;
    startDate = startOfDay(subDays(now, days));
    endDate = endOfDay(now);
  }

  // Use the correct query based on dateRange
  const billingsQuery =
    dateRange === "all"
      ? api.billing.getAllBillings.useQuery(
          {
            search: debouncedCompanyFilter,
            limit,
            page,
            sortBy,
            plan: undefined,
          },
          {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        )
      : api.billing.getBillingsByDateRange.useQuery(
          {
            companyId: "",
            startDate: startDate ?? new Date(),
            endDate: endDate ?? new Date(),
          },
          {
            enabled: !!startDate && !!endDate,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        );

  const billingsData = billingsQuery.data;
  const billingsLoading = billingsQuery.isLoading;
  const billingsError = billingsQuery.error;

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    setDateRange(value as "all" | "30" | "90");
  };

  // billings: for getAllBillings, use .data; for getBillingsByDateRange, use the array directly
  const billings = useMemo(() => {
    if (!billingsData) return [];
    if (dateRange === "all") {
      return (billingsData as unknown as { data: Billing[] }).data;
    } else {
      return billingsData as unknown as Billing[];
    }
  }, [billingsData, dateRange]);

  // Fetch total revenue using the API
  const {
    data: totalRevenueData,
    isLoading: totalRevenueLoading,
    error: totalRevenueError,
  } = api.billing.getTotalRevenue.useQuery({});

  // KPI calculations
  const outstandingAR = billings
    .filter((b: Billing) => b.status === "outstanding")
    .reduce((sum: number, b: Billing) => sum + Number(b.amount), 0);
  const outstandingCount = billings.filter(
    (b: Billing) => b.status === "outstanding",
  ).length;
  // Monthly recurring and new subs 30-day would require subscription data or more info
  const monthlyRecurring = 0;
  const newSubs30Day = 0;

  // Filtered invoices for the billing table
  const filteredInvoices = useMemo(() => {
    let invoices = billings.map((b: Billing) => ({
      id: b.id,
      date: format(new Date(b.billingDate), "MMM dd, yyyy"),
      status: b.status,
      amount: Number(b.amount),
      plan: b.plan ?? "",
      paymentStatus: b.paymentStatus ?? b.status,
      companyName: b.companyName ?? "",
      pdfUrl: b.pdfLink ?? "",
    }));

    if (kpiFilter) {
      invoices = invoices.filter((invoice) => invoice.status === kpiFilter);
    }
    if (companyFilter) {
      invoices = invoices.filter((invoice) =>
        invoice.companyName.toLowerCase().includes(companyFilter.toLowerCase()),
      );
    }
    return invoices;
  }, [billings, kpiFilter, companyFilter]);

  // Handle KPI card filter changes
  const handleKpiFilterChange = (filter: string) => {
    setKpiFilter(filter);
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

  const total = billingsData?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  if (billingsError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <div className="text-lg font-semibold text-red-500">
          Error loading billing data
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {billingsError.message || "Please try again later"}
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setCompanyFilter("");
          }}
        >
          Clear Selection
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
          {billingsLoading && (
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
                  totalRevenueLoading
                    ? "Loading..."
                    : totalRevenueError
                      ? "Error"
                      : `$${(totalRevenueData?.data ?? 0).toLocaleString()}`
                }
                className="border-gray-200 bg-white dark:!border-gray-700 dark:bg-gray-800"
                onFilterChange={handleKpiFilterChange}
              />
              <KpiCard
                title="Monthly Recurring"
                value={`$${monthlyRecurring.toLocaleString()}`}
                className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              />
              <KpiCard
                title="Outstanding AR"
                value={`$${outstandingAR.toLocaleString()}`}
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

            {/* Billing Table */}
            <div className="col-span-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                    Billing History
                  </span>
                  {kpiFilter && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Filtered by:</span>
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
                  onDateFilter={handleDateRangeChange}
                  emptyMessage={
                    !billingsLoading && filteredInvoices.length === 0
                      ? "No billing data found."
                      : undefined
                  }
                  onLoading={billingsLoading}
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
