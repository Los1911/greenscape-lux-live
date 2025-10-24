/**
 * GreenScape Lux Commission Calculator
 * Updated with new tiered commission structure
 */

import { calculateGreenScapeCommission, getCommissionRate, calculateStripeFee } from './compensation';

export interface CommissionCalculation {
  jobAmount: number;
  platformCommission: number;
  platformRate: number;
  stripeFee: number;
  landscaperPayout: number;
  platformNet: number;
}

/**
 * Calculate commission breakdown for a job
 * @param jobAmountCents Job amount in cents
 */
export function calculateCommission(jobAmountCents: number): CommissionCalculation {
  const jobAmount = jobAmountCents / 100;
  
  // Calculate platform commission using tiered rates
  const platformCommission = calculateGreenScapeCommission(jobAmount);
  const platformRate = getCommissionRate(jobAmount);
  
  // Calculate Stripe fee (2.9% + $0.30)
  const stripeFee = calculateStripeFee(jobAmountCents) / 100;
  
  // Landscaper gets: Job Amount - Platform Commission - Stripe Fee
  const landscaperPayout = jobAmount - platformCommission - stripeFee;
  
  // Platform net: Platform Commission - Stripe fee on platform commission
  const platformCommissionCents = Math.round(platformCommission * 100);
  const platformStripeFee = calculateStripeFee(platformCommissionCents) / 100;
  const platformNet = platformCommission - platformStripeFee;

  return {
    jobAmount,
    platformCommission,
    platformRate,
    stripeFee,
    landscaperPayout: Math.max(0, landscaperPayout),
    platformNet: Math.max(0, platformNet)
  };
}
/**
 * Format commission breakdown for display
 */
export function formatCommissionDisplay(breakdown: CommissionCalculation) {
  return {
    gross: `$${breakdown.jobAmount.toFixed(2)}`,
    stripeFee: `$${breakdown.stripeFee.toFixed(2)} (2.9% + $0.30)`,
    platformCommission: `$${breakdown.platformCommission.toFixed(2)} (${(breakdown.platformRate * 100).toFixed(0)}%)`,
    landscaperPayout: `$${breakdown.landscaperPayout.toFixed(2)}`,
    platformNet: `$${breakdown.platformNet.toFixed(2)}`
  };
}