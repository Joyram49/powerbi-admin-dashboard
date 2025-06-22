import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";

interface UserErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorType: "SUBSCRIPTION_REQUIRED" | "USER_LIMIT_EXCEEDED" | null;
  onProceed?: () => void;
  userRole: "superAdmin" | "admin" | "user";
}

export function UserErrorModal({
  isOpen,
  onClose,
  errorType,
  onProceed,
  userRole,
}: UserErrorModalProps) {
  const router = useRouter();

  const handleProceed = () => {
    if (errorType === "SUBSCRIPTION_REQUIRED") {
      if (userRole === "superAdmin") {
        router.push("/super-admin");
      } else {
        router.push("/admin/billing");
      }
    } else if (errorType === "USER_LIMIT_EXCEEDED" && onProceed) {
      onProceed();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            {errorType === "SUBSCRIPTION_REQUIRED"
              ? "Subscription Required"
              : "User Limit Reached"}
          </DialogTitle>
          <DialogDescription>
            {errorType === "SUBSCRIPTION_REQUIRED"
              ? "Your company needs an active subscription to add new users. Please purchase a subscription plan to continue."
              : "Your company has reached its user limit. You can purchase additional user access for $25 per user."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleProceed}
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {errorType === "SUBSCRIPTION_REQUIRED"
              ? userRole === "superAdmin"
                ? "Go to Dashboard"
                : "Go to Subscription"
              : "Purchase Additional User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
