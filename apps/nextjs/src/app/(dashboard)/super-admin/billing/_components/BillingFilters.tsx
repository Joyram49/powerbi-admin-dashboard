"use client";

import { useState } from "react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronDown, Filter, Search, X } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Calendar } from "@acme/ui/calendar";
import { Checkbox } from "@acme/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { toast } from "@acme/ui/toast";

import type { BillingFilters, BillingPlan, BillingStatus } from "../types";

const BILLING_STATUSES: { value: BillingStatus; label: string }[] = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "past_due", label: "Past Due" },
  { value: "failed", label: "Failed" },
];

const BILLING_PLANS: { value: BillingPlan; label: string }[] = [
  { value: "Data Foundation", label: "Data Foundation" },
  { value: "Strategic Navigator", label: "Strategic Navigator" },
  { value: "Insight Accelerator", label: "Insight Accelerator" },
  { value: "Enterprise", label: "Enterprise" },
  { value: "overage usage", label: "Overage Usage" },
];

interface BillingFiltersProps {
  filters: BillingFilters;
  onFiltersChange: (filters: BillingFilters) => void;
}

export function BillingFilters({
  filters,
  onFiltersChange,
}: BillingFiltersProps) {
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [planFilterOpen, setPlanFilterOpen] = useState(false);
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [amountFilterOpen, setAmountFilterOpen] = useState(false);

  // Temporary state for modal values
  const [tempStatus, setTempStatus] = useState<BillingStatus | undefined>(
    filters.status,
  );
  const [tempPlan, setTempPlan] = useState<BillingPlan | undefined>(
    filters.plan,
  );
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(
    filters.startDate,
  );
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(
    filters.endDate,
  );
  const [tempMinAmount, setTempMinAmount] = useState<number | undefined>(
    filters.minAmount,
  );
  const [tempMaxAmount, setTempMaxAmount] = useState<number | undefined>(
    filters.maxAmount,
  );

  // Date validation state
  const [dateError, setDateError] = useState<string | null>(null);

  const updateFilter = (key: keyof BillingFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value as BillingFilters[keyof BillingFilters] | undefined,
    });
  };

  const clearFilter = (key: keyof BillingFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) => filters[key as keyof BillingFilters] !== undefined,
  );

  const getActiveFiltersCount = () => {
    let count = 0;

    // Count individual filters
    if (filters.search) count++;
    if (filters.status) count++;
    if (filters.plan) count++;
    if (filters.minAmount !== undefined) count++;
    if (filters.maxAmount !== undefined) count++;

    // Count date range as a single filter if either date is set
    if (filters.startDate || filters.endDate) count++;

    return count;
  };

  // Reset temporary values when modal opens
  const openStatusModal = () => {
    setTempStatus(filters.status);
    setStatusFilterOpen(true);
    setMoreFiltersOpen(false);
  };

  const openPlanModal = () => {
    setTempPlan(filters.plan);
    setPlanFilterOpen(true);
    setMoreFiltersOpen(false);
  };

  const openDateModal = () => {
    setTempStartDate(filters.startDate);
    setTempEndDate(filters.endDate);
    setDateError(null);
    setDateFilterOpen(true);
    setMoreFiltersOpen(false);
  };

  const openAmountModal = () => {
    setTempMinAmount(filters.minAmount);
    setTempMaxAmount(filters.maxAmount);
    setAmountFilterOpen(true);
    setMoreFiltersOpen(false);
  };

  // Apply functions
  const applyStatusFilter = () => {
    updateFilter("status", tempStatus);
    setStatusFilterOpen(false);
  };

  const applyPlanFilter = () => {
    updateFilter("plan", tempPlan);
    setPlanFilterOpen(false);
  };

  const applyDateFilter = () => {
    // Validate dates before applying
    if (tempStartDate && tempEndDate && tempStartDate > tempEndDate) {
      setDateError("End date must be after start date");
      toast.error("End date must be after start date");
      return;
    }

    setDateError(null);
    onFiltersChange({
      ...filters,
      startDate: tempStartDate,
      endDate: tempEndDate,
    });
    setDateFilterOpen(false);
  };

  const applyAmountFilter = () => {
    // Validate amount range before applying
    if (
      tempMinAmount !== undefined &&
      tempMaxAmount !== undefined &&
      tempMinAmount > tempMaxAmount
    ) {
      toast.error(
        "Minimum amount must be less than or equal to maximum amount",
        {
          icon: <AlertCircle className="mr-2 h-6 w-6" />,
        },
      );
      return;
    }

    onFiltersChange({
      ...filters,
      minAmount: tempMinAmount,
      maxAmount: tempMaxAmount,
    });
    setAmountFilterOpen(false);
  };

  // Clear functions
  const clearStatusFilter = () => {
    clearFilter("status");
    setTempStatus(undefined);
    setStatusFilterOpen(false);
  };

  const clearPlanFilter = () => {
    clearFilter("plan");
    setTempPlan(undefined);
    setPlanFilterOpen(false);
  };

  const clearDateFilter = () => {
    onFiltersChange({
      ...filters,
      startDate: undefined,
      endDate: undefined,
    });
    setTempStartDate(undefined);
    setTempEndDate(undefined);
    setDateError(null);
    setDateFilterOpen(false);
  };

  const clearAmountFilter = () => {
    onFiltersChange({
      ...filters,
      minAmount: undefined,
      maxAmount: undefined,
    });
    setTempMinAmount(undefined);
    setTempMaxAmount(undefined);
    setAmountFilterOpen(false);
  };

  // Cancel functions (close without applying)
  const cancelStatusFilter = () => {
    setTempStatus(filters.status);
    setStatusFilterOpen(false);
  };

  const cancelPlanFilter = () => {
    setTempPlan(filters.plan);
    setPlanFilterOpen(false);
  };

  const cancelDateFilter = () => {
    setTempStartDate(filters.startDate);
    setTempEndDate(filters.endDate);
    setDateError(null);
    setDateFilterOpen(false);
  };

  const cancelAmountFilter = () => {
    setTempMinAmount(filters.minAmount);
    setTempMaxAmount(filters.maxAmount);
    setAmountFilterOpen(false);
  };

  // Handle date changes with validation
  const handleStartDateChange = (date: Date | undefined) => {
    setTempStartDate(date);
    if (date && tempEndDate && date > tempEndDate) {
      setDateError("End date must be after start date");
    } else {
      setDateError(null);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setTempEndDate(date);
    if (tempStartDate && date && tempStartDate > date) {
      setDateError("End date must be after start date");
    } else {
      setDateError(null);
    }
  };

  // Check if date range is active
  const hasDateRange = filters.startDate ?? filters.endDate;

  return (
    <div className="space-y-4">
      {/* Search and More Filters Row */}
      <div className="flex items-center gap-3">
        {/* Search Field - Always Visible */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by company name..."
            value={filters.search ?? ""}
            onChange={(e) =>
              updateFilter("search", e.target.value || undefined)
            }
            className="pl-10"
          />
        </div>

        {/* More Filters Button */}
        <DropdownMenu open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 whitespace-nowrap dark:bg-slate-900/50"
            >
              <Filter className="h-4 w-4" />
              More Filters
              {getActiveFiltersCount() > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                >
                  <span>{getActiveFiltersCount()}</span>
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 dark:bg-slate-900">
            <div className="p-2">
              <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                Filter by:
              </h3>
              <div className="space-y-1">
                <DropdownMenuItem
                  onClick={openStatusModal}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <span>Status</span>
                  {filters.status && (
                    <Badge variant="outline" className="text-xs">
                      {filters.status}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openPlanModal}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <span>Plan</span>
                  {filters.plan && (
                    <Badge variant="outline" className="text-xs">
                      {filters.plan}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openDateModal}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <span>Date Range</span>
                  {hasDateRange && (
                    <Badge variant="outline" className="text-xs">
                      Set
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openAmountModal}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <span>Amount Range</span>
                  {(filters.minAmount ?? filters.maxAmount) && (
                    <Badge variant="outline" className="text-xs">
                      Set
                    </Badge>
                  )}
                </DropdownMenuItem>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filter Chips */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap gap-2"
          >
            {filters.status && (
              <FilterChip
                label={`Status: ${filters.status}`}
                onClear={clearStatusFilter}
              />
            )}
            {filters.plan && (
              <FilterChip
                label={`Plan: ${filters.plan}`}
                onClear={clearPlanFilter}
              />
            )}
            {hasDateRange && (
              <FilterChip
                label={
                  filters.startDate && filters.endDate
                    ? `Date Range: ${format(filters.startDate, "MMM dd, yyyy")} - ${format(filters.endDate, "MMM dd, yyyy")}`
                    : filters.startDate
                      ? `From: ${format(filters.startDate, "MMM dd, yyyy")}`
                      : filters.endDate
                        ? `To: ${format(filters.endDate, "MMM dd, yyyy")}`
                        : ""
                }
                onClear={clearDateFilter}
              />
            )}
            {filters.minAmount && (
              <FilterChip
                label={`Min: $${filters.minAmount}`}
                onClear={clearAmountFilter}
              />
            )}
            {filters.maxAmount && (
              <FilterChip
                label={`Max: $${filters.maxAmount}`}
                onClear={clearAmountFilter}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Modals */}

      {/* Status Filter Modal */}
      <AnimatePresence>
        {statusFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={cancelStatusFilter}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Filter by Status
                </h3>
                <Button variant="ghost" size="sm" onClick={cancelStatusFilter}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mb-6 space-y-3">
                {BILLING_STATUSES.map((status) => (
                  <div
                    key={status.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={tempStatus === status.value}
                      onCheckedChange={(checked) => {
                        setTempStatus(checked ? status.value : undefined);
                      }}
                    />
                    <Label
                      htmlFor={`status-${status.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={clearStatusFilter}>
                  Clear
                </Button>
                <Button onClick={applyStatusFilter}>Apply</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan Filter Modal */}
      <AnimatePresence>
        {planFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={cancelPlanFilter}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Filter by Plan
                </h3>
                <Button variant="ghost" size="sm" onClick={cancelPlanFilter}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mb-6 space-y-3">
                {BILLING_PLANS.map((plan) => (
                  <div key={plan.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`plan-${plan.value}`}
                      checked={tempPlan === plan.value}
                      onCheckedChange={(checked) => {
                        setTempPlan(checked ? plan.value : undefined);
                      }}
                    />
                    <Label
                      htmlFor={`plan-${plan.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {plan.label}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={clearPlanFilter}>
                  Clear
                </Button>
                <Button onClick={applyPlanFilter}>Apply</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date Range Filter Modal */}
      <AnimatePresence>
        {dateFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={cancelDateFilter}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Filter by Date Range
                </h3>
                <Button variant="ghost" size="sm" onClick={cancelDateFilter}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Date Error Display */}
              {dateError && (
                <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{dateError}</span>
                </div>
              )}

              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Start Date</Label>
                  <Calendar
                    mode="single"
                    selected={tempStartDate}
                    onSelect={handleStartDateChange}
                    disabled={(date) =>
                      tempEndDate ? date > tempEndDate : false
                    }
                    initialFocus
                    className="rounded-md border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">End Date</Label>
                  <Calendar
                    mode="single"
                    selected={tempEndDate}
                    onSelect={handleEndDateChange}
                    disabled={(date) =>
                      tempStartDate ? date < tempStartDate : false
                    }
                    initialFocus
                    className="rounded-md border"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={clearDateFilter}>
                  Clear
                </Button>
                <Button onClick={applyDateFilter} disabled={!!dateError}>
                  Apply
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Amount Range Filter Modal */}
      <AnimatePresence>
        {amountFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={cancelAmountFilter}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Filter by Amount Range
                </h3>
                <Button variant="ghost" size="sm" onClick={cancelAmountFilter}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mb-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Minimum Amount</Label>
                  <Input
                    placeholder="Enter minimum amount"
                    type="number"
                    value={tempMinAmount ?? ""}
                    onChange={(e) =>
                      setTempMinAmount(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Maximum Amount</Label>
                  <Input
                    placeholder="Enter maximum amount"
                    type="number"
                    value={tempMaxAmount ?? ""}
                    onChange={(e) =>
                      setTempMaxAmount(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={clearAmountFilter}>
                  Clear
                </Button>
                <Button onClick={applyAmountFilter}>Apply</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Animated filter chip
function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Badge variant="secondary" className="gap-1">
        {label}
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0"
          onClick={onClear}
        >
          <X className="h-3 w-3" />
        </Button>
      </Badge>
    </motion.div>
  );
}
