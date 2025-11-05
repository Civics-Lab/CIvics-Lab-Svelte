export interface StripeConfig {
  id: string;
  workspaceId: string;
  publishableKey: string;
  secretKey: string; // Encrypted in database
  webhookSecret: string; // Encrypted in database
  platformFeePercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStripeConfigData {
  workspaceId: string;
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  platformFeePercentage?: number;
}

export interface UpdateStripeConfigData {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  platformFeePercentage?: number;
  isActive?: boolean;
}

export interface StripeConfigPublic {
  id: string;
  workspaceId: string;
  publishableKey: string;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  platformFeePercentage: number;
  isActive: boolean;
  webhookUrl: string;
}
