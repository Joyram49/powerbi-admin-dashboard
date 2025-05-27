import React from "react";

import { Button } from "@acme/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

interface Invoice {
  id: string;
  date: string;
  status: string;
  amount: number;
  plan: string;
}

interface BillingTableProps {
  invoices: Invoice[];
  onDownload?: (id: string) => void;
}

export function BillingTable({ invoices, onDownload }: BillingTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-900">
          <TableHead>Invoice</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => (
          <TableRow
            key={inv.id}
            className="hover:bg-gray-100 dark:hover:bg-gray-900 dark:border-gray-700"
          >
            <TableCell>{inv.id}</TableCell>
            <TableCell>{inv.date}</TableCell>
            <TableCell>{inv.status}</TableCell>
            <TableCell className="text-right">
              ${inv.amount.toLocaleString()}
            </TableCell>
            <TableCell>{inv.plan}</TableCell>
            <TableCell>
              <Button
                size="sm"
                className="text-white"
                onClick={() => onDownload?.(inv.id)}
              >
                Download
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
