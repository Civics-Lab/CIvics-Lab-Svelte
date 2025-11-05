import type { FormSubmissionWithDetails } from './formSubmission';
import type { Subscription } from './subscription';

export interface DonorPortalInvite {
  id: string;
  contactId: string;
  workspaceId: string;
  email: string;
  inviteToken: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

export interface CreateDonorInviteData {
  contactId: string;
  workspaceId: string;
  email: string;
}

export interface DonorDashboard {
  recentContributions: FormSubmissionWithDetails[];
  totalDonated: number;
  activeSubscriptions: number;
  organizations: any[]; // Workspace[]
  stats: {
    thisMonth: number;
    thisYear: number;
    allTime: number;
  };
}

export interface DonorContribution {
  id: string;
  date: Date;
  amount: number;
  organization: string;
  type: 'donation' | 'subscription' | 'product';
  formName: string;
  formSlug: string;
  status: string;
}

export interface DonorSubscriptionDetails extends Subscription {
  productName: string;
  nextBillingAmount: number;
  billingHistory: DonorBillingHistory[];
}

export interface DonorBillingHistory {
  id: string;
  date: Date;
  amount: number;
  status: string;
  receiptUrl?: string;
}
