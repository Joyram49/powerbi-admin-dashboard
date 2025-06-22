"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, Search } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import type { SubscriptionData, SubscriptionResponse } from "../types";
import { Pagination } from "~/app/(dashboard)/_components/Pagination";

interface SubscriptionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionData?: SubscriptionResponse;
}

export function SubscriptionDetailsModal({
  isOpen,
  onClose,
  subscriptionData,
}: SubscriptionDetailsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Use the passed subscription data instead of fetching - wrapped in useMemo
  const allSubscriptions: SubscriptionData[] = useMemo(
    () => subscriptionData?.data.subscriptions ?? [],
    [subscriptionData?.data.subscriptions],
  );

  // Filter subscriptions based on search term
  const filteredSubscriptions = useMemo(() => {
    if (!searchTerm) return allSubscriptions;

    return allSubscriptions.filter((sub) =>
      (sub.companyName ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [allSubscriptions, searchTerm]);

  // Apply pagination
  const paginatedSubscriptions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSubscriptions.slice(startIndex, startIndex + pageSize);
  }, [filteredSubscriptions, currentPage, pageSize]);

  const totalMRR = useMemo(() => {
    return filteredSubscriptions.reduce(
      (sum: number, sub: SubscriptionData) => sum + Number(sub.amount),
      0,
    );
  }, [filteredSubscriptions]);

  const totalSubscriptions = filteredSubscriptions.length;
  const totalPages = Math.ceil(totalSubscriptions / pageSize);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Active or Trial Subscriptions
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Summary Card */}
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Total Monthly Recurring Revenue: ${totalMRR.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {totalSubscriptions} subscriptions found
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by company name, plan, or status..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="pl-10"
            />
          </div>

          {/* Table */}
          {!subscriptionData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-slate-400" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-gray-200 dark:border-gray-700">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-900">
                    <TableRow>
                      <TableHead className="text-gray-900 dark:text-gray-100">
                        Company
                      </TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100">
                        Plan
                      </TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100">
                        Amount
                      </TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100">
                        Status
                      </TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100">
                        Next Billing
                      </TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100">
                        Overage Users
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSubscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-gray-500 dark:text-gray-400"
                        >
                          {searchTerm
                            ? "No subscriptions found matching your search."
                            : "No subscriptions available."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedSubscriptions.map(
                        (subscription: SubscriptionData) => (
                          <TableRow
                            key={subscription.id}
                            className="border-gray-200 dark:border-gray-700"
                          >
                            <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                              {subscription.companyName ?? "Unknown Company"}
                            </TableCell>
                            <TableCell className="text-gray-900 dark:text-gray-100">
                              <Badge variant="outline" className="text-xs">
                                {subscription.plan}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-900 dark:text-gray-100">
                              ${subscription.amount}/month
                            </TableCell>
                            <TableCell className="text-gray-900 dark:text-gray-100">
                              <Badge
                                variant={
                                  subscription.status === "active"
                                    ? "success"
                                    : subscription.status === "trialing"
                                      ? "secondary"
                                      : subscription.status === "canceled"
                                        ? "destructive"
                                        : "default"
                                }
                                className="capitalize"
                              >
                                {subscription.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-900 dark:text-gray-100">
                              {format(
                                new Date(subscription.currentPeriodEnd),
                                "MMM dd, yyyy",
                              )}
                            </TableCell>
                            <TableCell className="text-gray-900 dark:text-gray-100">
                              {subscription.overageUser > 0 ? (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  +{subscription.overageUser}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ),
                      )
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalSubscriptions}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
