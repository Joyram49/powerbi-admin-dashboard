"use client";

import React from "react";
import { ArrowUpDown, Check, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";

import type { BillingSortBy } from "../types";

interface ColumnSortPopupProps {
  column: string;
  currentSort: BillingSortBy;
  onSortChange: (sortBy: BillingSortBy) => void;
  children: React.ReactNode;
}

const SORT_OPTIONS: Record<string, { label: string; value: BillingSortBy }[]> =
  {
    companyName: [
      { label: "Default", value: "new_to_old_billing" },
      { label: "A to Z", value: "company_name_asc" },
      { label: "Z to A", value: "company_name_desc" },
    ],
    date: [
      { label: "Default", value: "new_to_old_billing" },
      { label: "Newest First", value: "new_to_old_billing" },
      { label: "Oldest First", value: "old_to_new_billing" },
    ],
    status: [
      { label: "Default", value: "new_to_old_billing" },
      { label: "A to Z", value: "status_asc" },
      { label: "Z to A", value: "status_desc" },
    ],
    plan: [
      { label: "Default", value: "new_to_old_billing" },
      { label: "A to Z", value: "company_name_asc" },
      { label: "Z to A", value: "company_name_desc" },
    ],
    amount: [
      { label: "Default", value: "new_to_old_billing" },
      { label: "High to Low", value: "high_to_low_amount" },
      { label: "Low to High", value: "low_to_high_amount" },
    ],
  };

const COLUMN_LABELS: Record<string, string> = {
  companyName: "Company Name",
  date: "Date",
  status: "Status",
  plan: "Plan",
  amount: "Amount",
};

export function ColumnSortPopup({
  column,
  currentSort,
  onSortChange,
  children,
}: ColumnSortPopupProps) {
  const options = SORT_OPTIONS[column] ?? [];
  const columnLabel = COLUMN_LABELS[column] ?? column;

  const getSortIcon = () => {
    if (currentSort.includes("company_name_asc") && column === "companyName") {
      return <ChevronUp className="h-4 w-4" />;
    }
    if (currentSort.includes("company_name_desc") && column === "companyName") {
      return <ChevronDown className="h-4 w-4" />;
    }
    if (currentSort.includes("status_asc") && column === "status") {
      return <ChevronUp className="h-4 w-4" />;
    }
    if (currentSort.includes("status_desc") && column === "status") {
      return <ChevronDown className="h-4 w-4" />;
    }
    if (currentSort.includes("new_to_old_billing") && column === "date") {
      return <ChevronDown className="h-4 w-4" />;
    }
    if (currentSort.includes("old_to_new_billing") && column === "date") {
      return <ChevronUp className="h-4 w-4" />;
    }
    if (currentSort.includes("high_to_low_amount") && column === "amount") {
      return <ChevronDown className="h-4 w-4" />;
    }
    if (currentSort.includes("low_to_high_amount") && column === "amount") {
      return <ChevronUp className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4" />;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto items-center gap-1 p-0 font-medium hover:bg-transparent"
        >
          {children}
          {getSortIcon()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-1">
          <div className="px-2 py-1 text-sm font-medium text-gray-500">
            Sort {columnLabel}
          </div>
          {options.map((option) => {
            const isActive = currentSort === option.value;
            return (
              <Button
                key={option.value + option.label}
                variant="ghost"
                size="sm"
                className={`flex w-full items-center justify-start gap-2 rounded-md ${
                  isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                } `}
                onClick={() => onSortChange(option.value)}
              >
                {isActive && (
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                )}
                {option.label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
