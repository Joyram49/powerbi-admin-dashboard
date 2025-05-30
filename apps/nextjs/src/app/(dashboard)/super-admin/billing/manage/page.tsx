"use client";

import { useState } from "react";

import { Button } from "@acme/ui/button";

import type { Tier } from "./types";
import { api } from "~/trpc/react";
import { ConfirmSubscriptionModal } from "./components/ConfirmSubscriptionModal";
import { UpgradePlanModal } from "./components/UpgradePlanModal";

function SuperAdminBillingManagePage() {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Tier | null>(null);
  const [shouldFetchSubscription, setShouldFetchSubscription] = useState(false);

  const createPortalSession = api.stripe.createPortalSession.useMutation();
  const upgradeSubscription = api.stripe.upgradeSubscription.useMutation();

  const {
    data: subscriptionData,
    isFetching,
    isError,
    error,
  } = api.subscription.getCurrentUserCompanySubscription.useQuery(
    {
      companyId: "07fee1f3-553f-4171-b024-cc6fcaa0727c",
    },
    {
      enabled: shouldFetchSubscription,
    },
  );

  const handleManageSubscription = async () => {
    try {
      const result = await createPortalSession.mutateAsync({
        companyId: "07fee1f3-553f-4171-b024-cc6fcaa0727c",
      });

      if (result.url) {
        window.open(result.url, "_blank");
      }
    } catch (error) {
      console.error("Failed to create portal session:", error);
    }
  };

  const handleUpgradeClick = () => {
    setShouldFetchSubscription(true);
    setIsUpgradeModalOpen(true);
  };

  const handlePlanSelect = (plan: Tier) => {
    setSelectedPlan(plan);
  };

  const handleUpgradeConfirm = async () => {
    if (!selectedPlan) return;

    try {
      await upgradeSubscription.mutateAsync({
        companyId: "07fee1f3-553f-4171-b024-cc6fcaa0727c",
        newTier: selectedPlan,
      });
      setIsConfirmModalOpen(false);
      setIsUpgradeModalOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error("Failed to upgrade subscription:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button onClick={handleManageSubscription}>Manage Subscription</Button>
        <Button onClick={handleUpgradeClick}>Upgrade Subscription</Button>
      </div>

      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
        onPlanSelect={handlePlanSelect}
        selectedPlan={selectedPlan}
        onContinue={() => setIsConfirmModalOpen(true)}
        isFetching={isFetching}
        isError={isError}
        error={error}
        subscriptionData={subscriptionData}
      />

      <ConfirmSubscriptionModal
        isOpen={isConfirmModalOpen}
        onOpenChange={setIsConfirmModalOpen}
        onConfirm={handleUpgradeConfirm}
        isFetching={isFetching}
        isError={isError}
        error={error}
        subscriptionData={subscriptionData}
        selectedPlan={selectedPlan}
      />
    </div>
  );
}

export default SuperAdminBillingManagePage;
