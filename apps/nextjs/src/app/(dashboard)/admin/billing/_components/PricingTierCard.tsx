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
        isActive
          ? isHovered
            ? "bg-gradient-to-r from-blue-500 via-pink-500 to-purple-500"
            : "bg-gradient-to-l from-blue-500 via-purple-500 to-pink-500"
          : isPreferredPlan
            ? "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"
            : isUpgrade
              ? "bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"
              : "from-blue-500 via-purple-500 to-pink-500 hover:bg-gradient-to-l",
      )}
    >
      <Card className="relative flex h-full flex-col rounded-lg border-none bg-white transition-all duration-300 hover:shadow-lg dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <CardTitle className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-2xl font-bold text-transparent dark:from-gray-100 dark:to-gray-300">
            {tier.name}
          </CardTitle>
          <CardDescription className="mt-2 text-gray-600 dark:text-gray-300">
            {tier.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-6">
          <p className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent dark:from-blue-400 dark:to-purple-400">
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
              "w-full rounded-lg py-3 font-semibold text-white transition-all duration-300",
              isPreferredPlan
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600"
                : isUpgrade
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-purple-500 dark:to-indigo-500 dark:hover:from-purple-600 dark:hover:to-indigo-600"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:via-indigo-600 dark:hover:to-purple-600",
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
