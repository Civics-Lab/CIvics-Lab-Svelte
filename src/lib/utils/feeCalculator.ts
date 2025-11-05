/**
 * Fee Calculator Utility
 * Calculates Stripe and platform fees for transactions
 */

export interface FeeCalculation {
  stripeFee: number;
  platformFee: number;
  netAmount: number;
  totalFees: number;
}

/**
 * Calculate fees for a transaction
 * @param grossAmount - The total transaction amount in cents
 * @param platformFeePercentage - The platform fee percentage (e.g., 2.5 for 2.5%)
 * @returns Calculated fees and net amount
 */
export function calculateFees(
  grossAmount: number,
  platformFeePercentage: number = 0
): FeeCalculation {
  // Stripe's standard fee: 2.9% + $0.30
  const stripeFeePercentage = 0.029; // 2.9%
  const stripeFeeFixed = 30; // $0.30 in cents

  // Calculate Stripe fee
  const stripeFee = Math.round(
    grossAmount * stripeFeePercentage + stripeFeeFixed
  );

  // Calculate platform fee
  const platformFee = Math.round(
    grossAmount * (platformFeePercentage / 100)
  );

  // Calculate net amount
  const netAmount = grossAmount - stripeFee - platformFee;
  const totalFees = stripeFee + platformFee;

  return {
    stripeFee,
    platformFee,
    netAmount,
    totalFees
  };
}

/**
 * Calculate the total needed to achieve a desired net amount after fees
 * @param desiredNet - The desired net amount after fees in cents
 * @param platformFeePercentage - The platform fee percentage
 * @returns The gross amount needed to achieve the desired net
 */
export function calculateGrossFromNet(
  desiredNet: number,
  platformFeePercentage: number = 0
): number {
  const stripeFeePercentage = 0.029;
  const stripeFeeFixed = 30;

  // Formula: gross = (net + fixed_fee) / (1 - stripe_percentage - platform_percentage)
  const totalPercentage = stripeFeePercentage + (platformFeePercentage / 100);
  const gross = Math.ceil((desiredNet + stripeFeeFixed) / (1 - totalPercentage));

  return gross;
}

/**
 * Format amount in cents to dollars
 * @param cents - Amount in cents
 * @returns Formatted dollar string
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
}

/**
 * Convert dollars to cents
 * @param dollars - Amount in dollars
 * @returns Amount in cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 * @param cents - Amount in cents
 * @returns Amount in dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}
