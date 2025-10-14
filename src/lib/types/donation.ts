/**
 * Donation type definitions
 */

export interface Donation {
  id: string;
  amount: number;
  contactId?: string;
  businessId?: string;
  status: 'promise' | 'donated' | 'processing' | 'cleared';
  paymentType?: string;
  notes?: string;
  // Recurring donations fields
  productId?: string;
  subscriptionId?: string;
  isRecurring: boolean;
  recurringPeriod: 'once' | 'weekly' | 'monthly';
  recurrenceNumber?: number;
  // ActBlue integration fields
  actblueOrderNumber?: string;
  actblueLineitemId?: string;
  actbluePaymentId?: string;
  actblueDonorId?: string;
  actblueData?: Record<string, any>;
  externalSource?: string;
  refundedAt?: string;
  disbursedAt?: string;
  recoveredAt?: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields for UI display
  formattedAmount?: string;
  formattedDate?: string;
}

export interface CreateDonationData {
  workspaceId: string;
  contactId?: string;
  businessId?: string;
  amount: number;
  status: 'promise' | 'donated' | 'processing' | 'cleared';
  paymentType?: string;
  notes?: string;
  productId?: string;
  subscriptionId?: string;
  isRecurring?: boolean;
  recurringPeriod?: 'once' | 'weekly' | 'monthly';
  recurrenceNumber?: number;
  actblueOrderNumber?: string;
  actblueLineitemId?: string;
  actblueData?: Record<string, any>;
  externalSource?: string;
}

export interface UpdateDonationData {
  amount?: number;
  status?: 'promise' | 'donated' | 'processing' | 'cleared';
  paymentType?: string;
  notes?: string;
  refundedAt?: string;
  disbursedAt?: string;
  recoveredAt?: string;
}
