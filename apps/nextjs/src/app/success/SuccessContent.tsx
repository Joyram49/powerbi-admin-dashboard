"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Copy } from "lucide-react";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

interface PaymentDetails {
  amount: string;
  currency: string;
  paymentStatus: string;
  paymentMethod: string;
  orderItems: {
    name: string;
    quantity: number | null;
    amount: string;
  }[];
  orderDate: string;
  orderId: string;
}

interface SuccessContentProps {
  customerEmail: string;
  paymentDetails: PaymentDetails;
}

export function SuccessContent({
  customerEmail,
  paymentDetails,
}: SuccessContentProps) {
  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(paymentDetails.orderId);
      toast.success("Order ID has been copied to clipboard");
    } catch {
      toast.error("Failed to copy. Please try copying manually");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100 py-8 dark:from-gray-900 dark:to-gray-800 sm:py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:p-6 md:p-8"
        >
          <div className="mb-6 text-center sm:mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 sm:h-16 sm:w-16" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 text-2xl font-bold text-gray-900 dark:text-white sm:mt-6 sm:text-3xl"
            >
              Payment Successful!
            </motion.h2>
          </div>

          {/* Order Details Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 sm:mb-8 sm:p-6"
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
              Order Details
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                  Order ID:
                </span>
                <button
                  onClick={copyOrderId}
                  className="group flex min-w-0 items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="min-w-0 max-w-[200px] truncate font-medium text-gray-900 dark:text-white sm:max-w-[300px] md:max-w-[400px]">
                    {paymentDetails.orderId}
                  </span>
                  <Copy className="h-4 w-4 flex-shrink-0 text-gray-500 transition-colors group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                  Date:
                </span>
                <span className="mt-1 font-medium text-gray-900 dark:text-white sm:mt-0">
                  {paymentDetails.orderDate}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                  Payment Method:
                </span>
                <span className="mt-1 font-medium capitalize text-gray-900 dark:text-white sm:mt-0">
                  {paymentDetails.paymentMethod}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                  Status:
                </span>
                <span className="mt-1 font-medium capitalize text-emerald-600 dark:text-emerald-400 sm:mt-0">
                  {paymentDetails.paymentStatus}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Order Items Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mb-6 sm:mb-8"
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
              Order Items
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {paymentDetails.orderItems.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                >
                  <div className="mb-2 sm:mb-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {paymentDetails.currency} {item.amount}
                  </p>
                </div>
              ))}
              <div className="mt-4 flex flex-col border-t border-gray-200 pt-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                  Total
                </span>
                <span className="mt-1 text-base font-semibold text-gray-900 dark:text-white sm:mt-0 sm:text-lg">
                  {paymentDetails.currency} {paymentDetails.amount}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mb-6 text-center sm:mb-8"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
              A confirmation email will be sent to{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {customerEmail}
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
              If you have any questions, please email{" "}
              <a
                href="mailto:orders@example.com"
                className="text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                orders@example.com
              </a>
            </p>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <Link href="/">
              <Button className="w-full rounded-lg bg-emerald-600 py-2.5 text-white transition-colors hover:bg-emerald-700 sm:py-3">
                Return to Dashboard
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
