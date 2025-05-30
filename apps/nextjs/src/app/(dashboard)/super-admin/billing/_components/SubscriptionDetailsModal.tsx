import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import { api } from "~/trpc/react";

interface SubscriptionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionDetailsModal({
  isOpen,
  onClose,
}: SubscriptionDetailsModalProps) {
  const { data: companies, isLoading } = api.company.getAllCompanies.useQuery(
    {
      limit: 100,
      sortBy: "companyName",
    },
    {
      enabled: isOpen,
    },
  );

  const { data: subscriptions } =
    api.subscription.getSubscriptionsByStatus.useQuery(
      {
        status: "active",
      },
      {
        enabled: isOpen,
      },
    );

  const activeSubscriptions =
    subscriptions?.map((sub) => ({
      ...sub,
      companyName:
        companies?.data.find((c) => c.id === sub.companyId)?.companyName ??
        "Unknown Company",
    })) ?? [];

  const totalMRR = activeSubscriptions.reduce(
    (sum, sub) => sum + Number(sub.amount),
    0,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Active Subscriptions
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Total Monthly Recurring Revenue: ${totalMRR.toLocaleString()}
            </h3>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-slate-400" />
            </div>
          ) : (
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSubscriptions.map((subscription) => (
                    <TableRow
                      key={subscription.id}
                      className="border-gray-200 dark:border-gray-700"
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {subscription.companyName}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {subscription.plan}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        ${subscription.amount}/month
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {subscription.status}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {new Date(
                          subscription.currentPeriodEnd,
                        ).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
