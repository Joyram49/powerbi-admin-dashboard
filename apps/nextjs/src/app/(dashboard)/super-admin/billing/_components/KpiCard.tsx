import { useState } from "react";

import { cn } from "@acme/ui";

import { SubscriptionDetailsModal } from "./SubscriptionDetailsModal";

interface KpiCardProps {
  title: string;
  value: string | number;
  className?: string;
  onClick?: () => void;
  onFilterChange?: (filter: string) => void;
}

export function KpiCard({
  title,
  value,
  className,
  onClick,
  onFilterChange,
}: KpiCardProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (title === "Monthly Recurring") {
      setShowModal(true);
    } else if (onFilterChange) {
      switch (title) {
        case "Outstanding AR":
        case "# Outstanding":
          onFilterChange("outstanding");
          break;
        case "Total Revenue":
          onFilterChange("paid");
          break;
        case "New Subs 30-Day":
          onFilterChange("new");
          break;
      }
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
      {title === "Monthly Recurring" && (
        <SubscriptionDetailsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
