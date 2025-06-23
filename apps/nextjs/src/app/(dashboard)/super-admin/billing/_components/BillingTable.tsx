import { useState } from "react";
import { format } from "date-fns";
import { AlertCircle, Loader2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@acme/ui/hover-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import type { BillingData, BillingSortBy } from "../types";
import { BillingTableSkeleton } from "./BillingTableSkeleton";
import { ColumnSortPopup } from "./ColumnSortPopup";

interface BillingTableProps {
  billings: BillingData[];
  onDownload?: (id: string) => void;
  onBulkDownload?: (ids: string[]) => void;
  emptyMessage?: string;
  onLoading?: boolean;
  isDownloading?: boolean;
  currentSort: BillingSortBy;
  onSortChange: (sortBy: BillingSortBy) => void;
}

export function BillingTable({
  billings,
  onDownload,
  onBulkDownload,
  emptyMessage,
  onLoading,
  isDownloading,
  currentSort,
  onSortChange,
}: BillingTableProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedInvoices(checked ? billings.map((b) => b.id) : []);
  };

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(id)
        ? prev.filter((invoiceId) => invoiceId !== id)
        : [...prev, id],
    );
  };

  if (onLoading) {
    return <BillingTableSkeleton rowCount={10} />;
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <div className="flex items-center gap-4">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                onClick={() => onBulkDownload?.(selectedInvoices)}
                disabled={isDownloading}
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening PDFs...
                  </>
                ) : (
                  `Download Selected (${selectedInvoices.length})`
                )}
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="min-w-fit max-w-xl border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <p className="mb-2 text-sm">
                Download the selected invoices as PDFs.
              </p>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <p className="text-sm font-medium">
                  Please unblock popups for this site to download the invoices.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
          <Button
            variant="outline"
            onClick={() => setSelectedInvoices([])}
            className="border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-blue-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="relative rounded-md border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
              <TableHead className="flex w-[50px] items-center justify-center">
                <Checkbox
                  checked={
                    billings.length > 0 &&
                    selectedInvoices.length === billings.length
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100">
                <ColumnSortPopup
                  column="companyName"
                  currentSort={currentSort}
                  onSortChange={onSortChange}
                >
                  Company Name
                </ColumnSortPopup>
              </TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100">
                # Invoice
              </TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100">
                <ColumnSortPopup
                  column="date"
                  currentSort={currentSort}
                  onSortChange={onSortChange}
                >
                  Date
                </ColumnSortPopup>
              </TableHead>
              <TableHead className="text-center text-gray-900 dark:text-gray-100">
                <ColumnSortPopup
                  column="status"
                  currentSort={currentSort}
                  onSortChange={onSortChange}
                >
                  Status
                </ColumnSortPopup>
              </TableHead>
              <TableHead className="text-center text-gray-900 dark:text-gray-100">
                <ColumnSortPopup
                  column="plan"
                  currentSort={currentSort}
                  onSortChange={onSortChange}
                >
                  Plan
                </ColumnSortPopup>
              </TableHead>
              <TableHead className="text-center text-gray-900 dark:text-gray-100">
                <ColumnSortPopup
                  column="amount"
                  currentSort={currentSort}
                  onSortChange={onSortChange}
                >
                  Amount
                </ColumnSortPopup>
              </TableHead>
              <TableHead className="text-right text-gray-900 dark:text-gray-100">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billings.length === 0 && emptyMessage ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              billings.map((billing) => (
                <TableRow
                  key={billing.id}
                  className="hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <TableCell className="flex h-[56px] items-center justify-center">
                    <Checkbox
                      checked={selectedInvoices.includes(billing.id)}
                      onCheckedChange={() => handleSelectInvoice(billing.id)}
                      aria-label={`Select invoice ${billing.id}`}
                    />
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {billing.companyName ?? "Unknown Company"}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {billing.id}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {format(new Date(billing.billingDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-center text-gray-900 dark:text-gray-100">
                    <Badge
                      variant={
                        billing.status === "paid"
                          ? "success"
                          : billing.status === "unpaid" ||
                              billing.status === "past_due"
                            ? "secondary"
                            : billing.status === "failed"
                              ? "destructive"
                              : "default"
                      }
                      className="capitalize"
                    >
                      {billing.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-gray-900 dark:text-gray-100">
                    <Badge variant="outline" className="text-xs">
                      {billing.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-gray-900 dark:text-gray-100">
                    ${Number(billing.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600"
                        onClick={() => onDownload?.(billing.id)}
                      >
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
