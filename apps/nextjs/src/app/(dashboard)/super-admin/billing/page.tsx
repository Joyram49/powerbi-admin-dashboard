"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Pagination } from "../../_components/Pagination";
import { useDebounce } from "../../../../hooks/useDebounce";
import { BillingTable } from "./_components/BillingTable";
import { KpiCard } from "./_components/KpiCard";

export default function BillingPage() {
  const [companyFilter, setCompanyFilter] = useState("");
  const debouncedCompanyFilter = useDebounce(companyFilter, 300);
  const [transactionStatus, setTransactionStatus] = useState<
    "all" | "paid" | "unpaid" | "past_due" | "failed" | "outstanding"
  >("all");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    | "new_to_old_billing"
    | "old_to_new_billing"
    | "high_to_low_amount"
    | "low_to_high_amount"
  >("new_to_old_billing");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedCompanyId, setSelectedCompanyId] = useState<
    string | undefined
  >(undefined);

  const router = useRouter();
  const searchParams = useSearchParams();

  // On mount, set selectedCompanyId from URL if present
  useEffect(() => {
    const companyIdFromUrl = searchParams.get("companyId");
    if (companyIdFromUrl) {
      setSelectedCompanyId(companyIdFromUrl);
    }
  }, [searchParams]);

  // Fetch all companies for the dropdown
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

  // Fetch all billings using the new API
  const {
    data: billingsData,
    isLoading: billingsLoading,
    error: billingsError,
  } = api.billing.getAllBillings.useQuery(
    {
      search: selectedCompanyId
        ? (companies.find((c) => c.id === selectedCompanyId)?.companyName ?? "")
        : debouncedCompanyFilter,
      limit,
      page,
      sortBy,
      status:
        transactionStatus === "all" || transactionStatus === "outstanding"
          ? undefined
          : (transactionStatus as
              | "paid"
              | "unpaid"
              | "past_due"
              | "failed"
              | undefined),
      plan: undefined,
    },
    {
      enabled: !companiesLoading,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  );
  const billings = useMemo(
    () => billingsData?.data ?? [],
    [billingsData?.data],
  );

  // Fetch total revenue using the API
  const {
    data: totalRevenueData,
    isLoading: totalRevenueLoading,
    error: totalRevenueError,
  } = api.billing.getTotalRevenue.useQuery({});

  // KPI calculations
  const outstandingAR = billings
    .filter((b) => b.status === "outstanding")
    .reduce((sum, b) => sum + Number(b.amount), 0);
  const outstandingCount = billings.filter(
    (b) => b.status === "outstanding",
  ).length;
  // Monthly recurring and new subs 30-day would require subscription data or more info
  const monthlyRecurring = 0;
  const newSubs30Day = 0;

  // Filtered invoices for the billing table
  const filteredInvoices = useMemo(() => {
    let invoices = billings.map((b) => ({
      id: b.id,
      date: format(new Date(b.billingDate), "MMM dd, yyyy"),
      status: b.status,
      amount: Number(b.amount),
      plan: "",
      paymentStatus: b.status,
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
    const billing = billings.find((b) => b.id === id);
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
        .map((id) => billings.find((b) => b.id === id)?.pdfLink)
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

  // Determine if a company is selected and has no billing data at all
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const allCompanyBillings =
    billingsData?.data.filter(
      (b) =>
        !selectedCompanyId || b.companyName === selectedCompany?.companyName,
    ) ?? [];
  const showNoBillingData =
    selectedCompanyId && !billingsLoading && allCompanyBillings.length === 0;

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
            setSelectedCompanyId(undefined);
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
        <div className="mb-4">
          <Select
            value={selectedCompanyId ?? ""}
            onValueChange={(value) => {
              if (value === "") {
                setSelectedCompanyId(undefined);
                // Remove companyId from URL
                const params = new URLSearchParams(searchParams.toString());
                params.delete("companyId");
                router.replace(`billing?${params.toString()}`);
              } else {
                setSelectedCompanyId(value);
                // Set companyId in URL
                const params = new URLSearchParams(searchParams.toString());
                params.set("companyId", value);
                router.replace(`billing?${params.toString()}`);
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
          {/* Clear selection button */}
          {selectedCompanyId && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-blue-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => {
                setSelectedCompanyId(undefined);
                const params = new URLSearchParams(searchParams.toString());
                params.delete("companyId");
                router.replace(`billing?${params.toString()}`);
              }}
            >
              Clear Selection
            </Button>
          )}
        </div>

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
            {showNoBillingData && (
              <div className="flex h-96 flex-col items-center justify-center gap-4">
                <div className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                  No Billing Data Available
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  This company has no billing history
                </div>
              </div>
            )}
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
                  emptyMessage={
                    !billingsLoading && filteredInvoices.length === 0
                      ? "No results found."
                      : undefined
                  }
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
