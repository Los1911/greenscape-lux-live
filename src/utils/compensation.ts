/**
 * GreenScape Lux Compensation System
 * Tiered commission structure based on job price
 */

export interface CommissionBreakdown {
  jobPrice: number;
  platformFee: number;
  platformRate: number;
  stripeFee: number;
  landscaperNet: number;
  platformNet: number;
}

/**
 * Calculate GreenScape platform commission based on tiered rates
 */
export function calculateGreenScapeCommission(jobPrice: number): number {
  if (jobPrice < 100) return jobPrice * 0.15; // 15% for jobs under $100
  if (jobPrice < 500) return jobPrice * 0.12; // 12% for jobs $100-$499
  return jobPrice * 0.10; // 10% for jobs $500+
}

/**
 * Get commission rate for a given job price
 */
export function getCommissionRate(jobPrice: number): number {
  if (jobPrice < 100) return 0.15;
  if (jobPrice < 500) return 0.12;
  return 0.10;
}

/**
 * Calculate Stripe processing fee (2.9% + $0.30)
 */
export function calculateStripeFee(amount: number): number {
  return Math.round(amount * 0.029 + 30); // In cents
}

/**
 * Complete commission breakdown calculation
 */
export function calculateCommissionBreakdown(jobPriceCents: number): CommissionBreakdown {
  const jobPrice = jobPriceCents / 100;
  const platformFee = calculateGreenScapeCommission(jobPrice);
  const platformRate = getCommissionRate(jobPrice);
  
  // Calculate amounts in cents for precision
  const platformFeeCents = Math.round(platformFee * 100);
  const stripeFee = calculateStripeFee(jobPriceCents);
  const landscaperNetCents = jobPriceCents - platformFeeCents - stripeFee;
  const platformNetCents = platformFeeCents - Math.round(platformFeeCents * 0.029 + 30);

  return {
    jobPrice,
    platformFee,
    platformRate,
    stripeFee: stripeFee / 100,
    landscaperNet: landscaperNetCents / 100,
    platformNet: Math.max(0, platformNetCents / 100)
  };
}