"use client";

import { useEffect } from "react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { toast } from "@acme/ui/toast";

import type { SubscriptionData, Tier } from "../types";
import { tierProducts } from "../constants";

interface UpgradePlanModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanSelect: (plan: Tier) => void;
  selectedPlan: Tier | null;
  onContinue: () => void;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  subscriptionData: SubscriptionData | undefined;
}

export function UpgradePlanModal({
  isOpen,
  onOpenChange,
  onPlanSelect,
  selectedPlan,
  onContinue,
  isFetching,
  isError,
  error,
  subscriptionData,
}: UpgradePlanModalProps) {
  useEffect(() => {
    if (!isFetching && !subscriptionData?.data) {
      toast.error("No Active Subscription", {
        description: "You need an active subscription to upgrade your plan.",
      });
      onOpenChange(false);
    }
  }, [isFetching, subscriptionData, onOpenChange]);

  const getUpgradeablePlans = () => {
    if (!subscriptionData?.data) {
      return [];
    }

    const currentPlan = subscriptionData.data.plan
      .toLowerCase()
      .split(" ")
      .join("_") as Tier;

    const validUpgrades: Record<Tier, Tier[]> = {
      data_foundation: [
        "insight_accelerator",
        "strategic_navigator",
        "enterprise",
      ],
      insight_accelerator: ["strategic_navigator", "enterprise"],
      strategic_navigator: ["enterprise"],
      enterprise: [],
    };

    return validUpgrades[currentPlan];
  };

  const getPlanDetails = (plan: Tier) => {
    const planConfig = (
      tierProducts as Record<Tier, { name: string; userLimit: number }>
    )[plan];
    return {
      name: planConfig.name,
      userLimit: planConfig.userLimit,
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upgrade Subscription</DialogTitle>
          <DialogDescription>
            Select a new plan to upgrade your subscription
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isFetching ? (
            <div className="flex h-[200px] items-center justify-center">
              <div className="text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">
                  Loading subscription data...
                </p>
              </div>
            </div>
          ) : isError ? (
            <div className="text-center">
              <p className="text-sm text-destructive">
                Error loading subscription:{" "}
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          ) : !subscriptionData?.data ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                No active subscription found. Please subscribe to a plan first.
              </p>
            </div>
          ) : (
            getUpgradeablePlans().map((plan) => {
              const { name, userLimit } = getPlanDetails(plan);
              return (
                <Button
                  key={plan}
                  variant={selectedPlan === plan ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => onPlanSelect(plan)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{name}</span>
                    <span className="text-sm text-muted-foreground">
                      {userLimit} users
                    </span>
                  </div>
                </Button>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onContinue}
            disabled={
              !selectedPlan || isFetching || isError || !subscriptionData?.data
            }
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
