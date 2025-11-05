export type TransactionType = 'donation' | 'subscription' | 'product';
export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface StripeTransaction {
  id: string;
  workspaceId: string;
  contactId?: string;
  formSubmissionId?: string;
  donationId?: string;
  subscriptionId?: string;
  amount: number;
  stripeFee: number;
  platformFee: number;
  netAmount: number;
  stripePaymentIntentId: string;
  stripeChargeId?: string;
  type: TransactionType;
  status: TransactionStatus;
  payoutStatus: PayoutStatus;
  payoutDate?: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface StripeTransactionWithDetails extends StripeTransaction {
  workspace?: any;
  contact?: any;
  formSubmission?: any;
}

export interface StripePayout {
  id: string;
  workspaceId: string;
  payoutAmount: number;
  transactionIds: string[];
  totalGross: number;
  totalStripeFees: number;
  totalPlatformFees: number;
  payoutMethod?: string;
  status: PayoutStatus;
  createdAt: Date;
  completedAt?: Date;
  createdById: string;
  notes?: string;
}

export interface CreateStripeTransactionData {
  workspaceId: string;
  contactId?: string;
  formSubmissionId?: string;
  donationId?: string;
  subscriptionId?: string;
  amount: number;
  stripeFee: number;
  platformFee: number;
  netAmount: number;
  stripePaymentIntentId: string;
  stripeChargeId?: string;
  type: TransactionType;
  metadata?: Record<string, any>;
}

export interface CreateStripePayoutData {
  workspaceId: string;
  transactionIds: string[];
  payoutMethod?: string;
  notes?: string;
}

export interface TransactionFilters {
  workspaceId?: string;
  status?: TransactionStatus;
  payoutStatus?: PayoutStatus;
  type?: TransactionType;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface TransactionSummary {
  totalGross: number;
  totalStripeFees: number;
  totalPlatformFees: number;
  totalNet: number;
  transactionCount: number;
  averageTransaction: number;
}
