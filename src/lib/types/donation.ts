/**
 * Donation type definitions
 */

export interface Donation {
  id: string;
  amount: number;
  contactId?: string;
  businessId?: string;
  status: 'promise' | 'donated' | 'processing' | 'cleared';
  createdAt: string;
  updatedAt: string;
  // Additional fields for UI display
  formattedAmount?: string;
  formattedDate?: string;
}
