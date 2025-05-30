"use client";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";

import type { SubscriptionData, Tier } from "../types";
import { tierProducts } from "../constants";

interface ConfirmSubscriptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  subscriptionData: SubscriptionData | undefined;
  selectedPlan: Tier | null;
}

export function ConfirmSubscriptionModal({
  isOpen,
  onOpenChange,
  onConfirm,
  isFetching,
  isError,
  error,
  subscriptionData,
  selectedPlan,
}: ConfirmSubscriptionModalProps) {
  const currentPlan = subscriptionData?.data
    ? subscriptionData.data.plan.toLowerCase().split(" ").join("_")
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {subscriptionData?.data
              ? "Confirm Subscription Upgrade"
              : "Confirm New Subscription"}
          </DialogTitle>
          <DialogDescription>
            Please review the following information before proceeding:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
          ) : (
            <>
              {subscriptionData?.data && (
                <div>
                  <h4 className="font-medium">Current Plan</h4>
                  <p className="text-sm text-muted-foreground">
                    {currentPlan && currentPlan in tierProducts
                      ? (tierProducts as Record<Tier, { name: string }>)[
                          currentPlan as Tier
                        ].name
                      : "Unknown"}
                  </p>
                </div>
              )}
              <div>
                <h4 className="font-medium">New Plan</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedPlan
                    ? (tierProducts as Record<Tier, { name: string }>)[
                        selectedPlan
                      ].name
                    : "None selected"}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Important Notes</h4>
                <ul className="list-disc pl-4 text-sm text-muted-foreground">
                  {subscriptionData?.data && (
                    <li>
                      Your recurring fee will be prorated at the end of the
                      current billing period
                    </li>
                  )}
                  <li>A setup fee will be charged immediately</li>
                  <li>
                    Your user limit will be updated to{" "}
                    {selectedPlan
                      ? (tierProducts as Record<Tier, { userLimit: number }>)[
                          selectedPlan
                        ].userLimit
                      : 0}{" "}
                    users
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isFetching || isError}>
            {subscriptionData?.data ? "Confirm Upgrade" : "Start Subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
