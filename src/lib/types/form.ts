export type FormType = 'donation' | 'product' | 'subscription';
export type FormStatus = 'active' | 'inactive';

export interface EditorJsBlock {
  id?: string;
  type: string;
  data: any;
}

export interface EditorJsData {
  time?: number;
  blocks: EditorJsBlock[];
  version?: string;
}

export interface Form {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  leftContent: EditorJsData;
  type: FormType;
  linkedItemId: string;
  footerContent: EditorJsData;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
}

export interface FormWithDetails extends Form {
  linkedItem?: any; // Can be Donation | Product | Subscription
  submissionCount?: number;
  totalRaised?: number;
}

export interface CreateFormData {
  workspaceId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  leftContent: EditorJsData;
  type: FormType;
  linkedItemId: string;
  footerContent: EditorJsData;
  isActive?: boolean;
}

export interface UpdateFormData {
  name?: string;
  slug?: string;
  logoUrl?: string;
  leftContent?: EditorJsData;
  type?: FormType;
  linkedItemId?: string;
  footerContent?: EditorJsData;
  isActive?: boolean;
}
