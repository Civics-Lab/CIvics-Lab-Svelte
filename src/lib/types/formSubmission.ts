import type { Form } from './form';
import type { Contact } from './contact';

export type SubmissionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface FormSubmission {
  id: string;
  formId: string;
  contactId: string;
  workspaceId: string;
  amount: number;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  status: SubmissionStatus;
  submissionData: Record<string, any>;
  submittedAt: Date;
  metadata?: Record<string, any>;
}

export interface FormSubmissionWithDetails extends FormSubmission {
  form?: Form;
  contact?: Contact;
}

export interface CreateFormSubmissionData {
  formId: string;
  contactId: string;
  workspaceId: string;
  amount: number;
  stripePaymentIntentId?: string;
  submissionData: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface DonorFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  employer?: string;
  occupation?: string;
}
