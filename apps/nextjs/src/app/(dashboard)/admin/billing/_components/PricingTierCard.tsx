"use client";

import { useState } from "react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

type TierId =
  | "data_foundation"
  | "insight_accelerator"
  | "strategic_navigator"
  | "enterprise";

interface PricingTierCardProps {
  tier: {
    id: TierId;
    name: string;
    description: string;
    price: string;
    features: string[];
    addOns: string[];
  };
  isActive: boolean;
  onSubscribe: (tierId: TierId) => void;
  loading: string | null | boolean;
  selectedCompanyId: string | undefined;
  isPreferredPlan?: boolean;
  isUpgrade?: boolean;
}

export function PricingTierCard({
  tier,
  isActive,
  onSubscribe,
  loading,
  selectedCompanyId,
  isPreferredPlan = false,
  isUpgrade = false,
}: PricingTierCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => isActive && setIsHovered(true)}
      onMouseLeave={() => isActive && setIsHovered(false)}
      className={cn(
        "group relative rounded-lg p-[2px] transition-all duration-500",
        "[transition-property:background,border-color,box-shadow]",
        isActive
          ? isHovered
            ? "bg-gradient-to-r from-[#10568a] to-[#2c93d0]"
            : "bg-gradient-to-l from-[#10568a] to-[#2c93d0]"
          : isPreferredPlan
            ? "bg-gradient-to-r from-[#2c93d0] to-[#10568a]"
            : isUpgrade
              ? "bg-gradient-to-r from-[#2c93d0] to-[#10568a]"
              : "bg-gradient-to-l from-[#10568a] to-[#2c93d0] hover:bg-gradient-to-r",
      )}
    >
      <Card className="relative flex h-full flex-col rounded-lg border-2 border-transparent bg-white transition-all duration-500 group-hover:border-[#2c93d0] group-hover:shadow-xl dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <CardTitle className="bg-gradient-to-r from-[#10568a] to-[#2c93d0] bg-clip-text text-2xl font-bold text-transparent dark:from-[#2c93d0] dark:to-[#10568a]">
            {tier.name}
          </CardTitle>
          <CardDescription className="mt-2 text-gray-600 dark:text-gray-300">
            {tier.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-6">
          <p className="text-2xl font-bold text-[#10568a] dark:text-[#2c93d0]">
            {tier.price}
          </p>
          <div className="mt-4">
            <h4 className="mb-1 font-semibold text-gray-800 dark:text-gray-200">
              Features
            </h4>
            <ul className="list-inside list-disc text-sm text-gray-700 dark:text-gray-300">
              {tier.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>
          <div className="mt-3">
            <h4 className="mb-1 font-semibold text-gray-800 dark:text-gray-200">
              Add Ons
            </h4>
            <ul className="list-inside list-disc text-sm text-gray-700 dark:text-gray-300">
              {tier.addOns.map((addOn, idx) => (
                <li key={idx}>{addOn}</li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="p-6">
          <Button
            className={cn(
              "w-full rounded-lg bg-gradient-to-r from-[#10568a] to-[#2c93d0] py-3 font-semibold text-white transition-all duration-300 hover:from-[#2c93d0] hover:to-[#10568a]",
              isPreferredPlan
                ? "bg-gradient-to-r from-[#2c93d0] to-[#10568a] hover:from-[#10568a] hover:to-[#2c93d0] dark:from-[#2c93d0] dark:to-[#10568a] dark:hover:from-[#10568a] dark:hover:to-[#2c93d0]"
                : isUpgrade
                  ? "bg-gradient-to-r from-[#2c93d0] to-[#10568a] hover:from-[#10568a] hover:to-[#2c93d0] dark:from-[#2c93d0] dark:to-[#10568a] dark:hover:from-[#10568a] dark:hover:to-[#2c93d0]"
                  : "bg-gradient-to-r from-[#10568a] to-[#2c93d0] hover:from-[#2c93d0] hover:to-[#10568a] dark:from-[#10568a] dark:to-[#2c93d0] dark:hover:from-[#2c93d0] dark:hover:to-[#10568a]",
            )}
            onClick={() => onSubscribe(tier.id)}
            disabled={loading !== null || isActive || !selectedCompanyId}
          >
            {loading === tier.id ? (
              <span className="flex items-center justify-center">
                <svg
                  className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : isActive ? (
              "Subscribed"
            ) : isPreferredPlan ? (
              "Activate"
            ) : isUpgrade ? (
              "Update"
            ) : (
              "Subscribe"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
