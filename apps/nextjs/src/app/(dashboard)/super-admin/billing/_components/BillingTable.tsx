import React, { useState } from "react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import { BillingTableSkeleton } from "./BillingTableSkeleton";

interface Invoice {
  id: string;
  date: string;
  status: string;
  amount: number;
  plan: string;
  companyName: string;
  pdfUrl: string;
}

interface BillingTableProps {
  invoices: Invoice[];
  onDownload?: (id: string) => void;
  onBulkDownload?: (ids: string[]) => void;
  onCompanyFilter: (search: string) => void;
  onDateFilter?: (filter: string) => void;
  emptyMessage?: string;
  onLoading?: boolean;
}

export function BillingTable({
  invoices,
  onDownload,
  onBulkDownload,
  onCompanyFilter,
  onDateFilter,
  emptyMessage,
  onLoading,
}: BillingTableProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedInvoices(checked ? invoices.map((i) => i.id) : []);
  };

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(id)
        ? prev.filter((invoiceId) => invoiceId !== id)
        : [...prev, id],
    );
  };

  if (onLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Input
            placeholder="Search companies..."
            disabled
            className="w-full border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 sm:w-64"
          />
          <Select disabled defaultValue="all" onValueChange={onDateFilter}>
            <SelectTrigger className="w-full border-gray-200 bg-white text-gray-900 ring-offset-white focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:ring-offset-gray-800 dark:focus:ring-blue-400 sm:w-48">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <BillingTableSkeleton rowCount={10} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Input
          placeholder="Search companies..."
          onChange={(e) => onCompanyFilter(e.target.value)}
          className="w-full border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 sm:w-64"
        />
        <Select onValueChange={onDateFilter} defaultValue="all">
          <SelectTrigger className="w-full border-gray-200 bg-white text-gray-900 ring-offset-white focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:ring-offset-gray-800 dark:focus:ring-blue-400 sm:w-48">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <SelectItem
              value="all"
              className="text-gray-900 focus:bg-blue-50 focus:text-blue-900 dark:text-gray-100 dark:focus:bg-blue-900/20 dark:focus:text-blue-100"
            >
              All Time
            </SelectItem>
            <SelectItem
              value="30"
              className="text-gray-900 focus:bg-blue-50 focus:text-blue-900 dark:text-gray-100 dark:focus:bg-blue-900/20 dark:focus:text-blue-100"
            >
              Last 30 Days
            </SelectItem>
            <SelectItem
              value="90"
              className="text-gray-900 focus:bg-blue-50 focus:text-blue-900 dark:text-gray-100 dark:focus:bg-blue-900/20 dark:focus:text-blue-100"
            >
              Last 90 Days
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <div className="flex items-center gap-4">
          <Button
            onClick={() => onBulkDownload?.(selectedInvoices)}
            className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600"
          >
            Download Selected ({selectedInvoices.length})
          </Button>
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
                    invoices.length > 0 &&
                    selectedInvoices.length === invoices.length
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100">
                Company Name
              </TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100">
                # Invoice
              </TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100">
                Date
              </TableHead>
              <TableHead className="text-center text-gray-900 dark:text-gray-100">
                Status
              </TableHead>
              <TableHead className="text-center text-gray-900 dark:text-gray-100">
                Amount
              </TableHead>
              <TableHead className="text-right text-gray-900 dark:text-gray-100">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 && emptyMessage ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <TableCell className="flex h-[56px] items-center justify-center">
                    <Checkbox
                      checked={selectedInvoices.includes(inv.id)}
                      onCheckedChange={() => handleSelectInvoice(inv.id)}
                      aria-label={`Select invoice ${inv.id}`}
                    />
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {inv.companyName}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {inv.id}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {inv.date}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    <Badge
                      variant={
                        inv.status === "paid"
                          ? "success"
                          : inv.status === "outstanding"
                            ? "secondary"
                            : inv.status === "failed"
                              ? "destructive"
                              : "default"
                      }
                      className="capitalize"
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-gray-900 dark:text-gray-100">
                    ${inv.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600"
                        onClick={() => onDownload?.(inv.id)}
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
