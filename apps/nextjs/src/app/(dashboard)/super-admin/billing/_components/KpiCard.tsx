"use client";

import { useState } from "react";

import { cn } from "@acme/ui";

import { SubscriptionDetailsModal } from "./SubscriptionDetailsModal";

interface KpiCardProps {
  title: string;
  value: string | number;
  className?: string;
}

export function KpiCard({ title, value, className }: KpiCardProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (title === "Monthly Recurring" || title === "New Subs 30-Day") {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-4 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            <SubscriptionDetailsModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
