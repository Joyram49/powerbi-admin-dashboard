import React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

interface Transaction {
  id: string;
  date: string;
  description: string;
  status: string;
  amount: number;
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <Table className="border-gray-200 dark:border-gray-700">
      <TableHeader className="border-gray-200 dark:border-gray-700">
        <TableRow className="hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-900">
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length === 0 ? (
          <TableRow className="hover:bg-gray-100 dark:hover:bg-gray-900 dark:border-gray-700">
            <TableCell
              colSpan={4}
              className="h-24 text-center text-gray-500 dark:text-gray-400"
            >
              No transactions found
            </TableCell>
          </TableRow>
        ) : (
          transactions.map((tx) => (
            <TableRow
              key={tx.id}
              className="hover:bg-gray-100 dark:hover:bg-gray-900 dark:border-gray-700"
            >
              <TableCell>{tx.date}</TableCell>
              <TableCell>{tx.description}</TableCell>
              <TableCell>{tx.status}</TableCell>
              <TableCell className="text-right">
                ${tx.amount.toLocaleString()}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
