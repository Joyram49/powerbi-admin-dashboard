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
