export type PaymentStatus = "pending" | "paid" | "failed";

export interface Purchase {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  customer_name: string;
  email: string;
  phone: string;
  gstin?: string;
  amount_base: number;
  amount_gst: number;
  amount_total: number;
  payment_status: PaymentStatus;
  plan_type: string;
  emi_months?: number;
  created_at: string;
  paid_at?: string;
}

export interface License {
  id: string;
  purchase_id: string;
  license_key: string;
  email: string;
  is_active: boolean;
  activated_at?: string;
  machine_id?: string;
  created_at: string;
}

export interface TrialRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  trial_license_key?: string;
  trial_expires_at?: string;
  download_sent: boolean;
  converted: boolean;
  ip_address?: string;
  created_at: string;
}

export interface SoftwareVersion {
  id: string;
  version: string;
  release_notes?: string;
  download_url: string;
  file_size_mb?: number;
  is_latest: boolean;
  released_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: "super_admin" | "support";
  created_at: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  purchaseId: string;
}

export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  gstin?: string;
}

export interface TrialFormData {
  name: string;
  email: string;
  phone: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeLicenses: number;
  trialRequests: number;
  conversionRate: number;
}
