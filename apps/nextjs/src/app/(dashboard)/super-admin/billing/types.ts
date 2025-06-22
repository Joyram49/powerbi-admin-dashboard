export type BillingSortBy =
  | "old_to_new_billing"
  | "new_to_old_billing"
  | "high_to_low_amount"
  | "low_to_high_amount"
  | "old_to_new_created"
  | "new_to_old_created"
  | "company_name_asc"
  | "company_name_desc"
  | "status_asc"
  | "status_desc";

export type BillingStatus = "paid" | "unpaid" | "past_due" | "failed";

export type BillingPlan =
  | "Data Foundation"
  | "Strategic Navigator"
  | "Insight Accelerator"
  | "Enterprise"
  | "overage usage";

export interface BillingFilters {
  search?: string;
  status?: BillingStatus;
  paymentStatus?: BillingStatus;
  plan?: BillingPlan;
  companyIds?: string[];
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface BillingData {
  id: string;
  invoiceId?: string;
  companyName?: string | null;
  billingDate: string | Date;
  amount: number;
  status: string;
  paymentStatus: string;
  plan: string;
  pdfLink?: string | null;
  dateCreated?: string | Date;
  updatedAt?: string | Date;
}

export interface BillingResponse {
  message: string;
  success: boolean;
  page: number;
  limit: number;
  data: BillingData[];
  total: number;
}

// Subscription types
export interface SubscriptionData {
  id: string;
  stripeSubscriptionId: string;
  companyName?: string | null;
  plan: string;
  amount: number;
  billingInterval: "monthly" | "yearly" | "weekly" | "daily";
  status: string;
  userLimit: number;
  overageUser: number;
  currentPeriodEnd: string | Date;
  dateCreated: string | Date;
  updatedAt: string | Date;
}

export interface SubscriptionResponse {
  success: boolean;
  message: string;
  total: number;
  limit: number;
  page: number;
  data: {
    timeframe: string;
    startDate: Date | null;
    endDate: Date;
    subscriptions: SubscriptionData[];
  };
}

// Subscription filter and sort types
export type SubscriptionSortBy =
  | "old_to_new_date"
  | "new_to_old_date"
  | "high_to_low_overage"
  | "low_to_high_overage"
  | "company_name_asc"
  | "company_name_desc"
  | "plan_asc"
  | "plan_desc"
  | "amount_high_to_low"
  | "amount_low_to_high";

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "trialing"
  | "canceled";

export type SubscriptionPlan =
  | "Data Foundation"
  | "Strategic Navigator"
  | "Insight Accelerator"
  | "Enterprise";

export interface SubscriptionFilters {
  search?: string;
  status?: SubscriptionStatus;
  plan?: SubscriptionPlan;
  timeframe?: "all" | "1d" | "7d" | "1m" | "3m" | "6m" | "1y";
}
