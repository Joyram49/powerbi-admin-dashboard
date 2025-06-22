"use client";

import { useState } from "react";

import { cn } from "@acme/ui";

import type { SubscriptionResponse } from "../types";
import { SubscriptionDetailsModal } from "./SubscriptionDetailsModal";

interface KpiCardProps {
  title: string;
  value: string | number;
  className?: string;
  subscriptionData?: SubscriptionResponse;
}

export function KpiCard({
  title,
  value,
  className,
  subscriptionData,
}: KpiCardProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (title === "Monthly Recurring") {
      setShowModal(true);
    }
  };

  return (
    <>
      <div
        className={cn(
          "cursor-pointer rounded-lg border p-4 shadow-sm transition-all hover:shadow-md",
          className,
        )}
        onClick={handleClick}
      >
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {value}
        </p>
      </div>
      {showModal && (
        <SubscriptionDetailsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          subscriptionData={subscriptionData}
        />
      )}
    </>
  );
}
