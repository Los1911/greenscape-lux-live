/**
 * Centralized payout calculation utility.
 *
 * Every code path that transitions a job into 'completed' or any payout-eligible
 * status MUST use this module to derive `payout_amount`.  Keeping the logic here
 * means a future change to the fee structure only requires a single edit.
 */

/** Platform fee expressed as a decimal (15 %). */
export const PLATFORM_FEE_RATE = 0.15;

/**
 * Calculate the landscaper payout for a given job price.
 *
 * @param price  The client-facing price (or admin-override price) in dollars.
 *               `null`, `undefined`, `0`, and negative values are treated as
 *               zero — the caller should guard against this where appropriate.
 * @returns      The payout amount rounded to two decimal places, or `0` when
 *               no valid price is provided.
 */
export function calculatePayoutAmount(price: number | null | undefined): number {
  const safePrice = typeof price === 'number' && price > 0 ? price : 0;
  // Round to 2 decimal places to avoid floating-point dust
  return Math.round(safePrice * (1 - PLATFORM_FEE_RATE) * 100) / 100;
}

/**
 * Derive the best available payout amount for a job, preferring an existing
 * authoritative value (e.g. from a payments record) and falling back to the
 * standard calculation from the job price.
 *
 * The returned value is **never** `null` — it is always a number >= 0.
 *
 * @param existingPayoutAmount  An already-calculated payout (e.g. `payment.landscaper_payout`).
 * @param jobPrice              The job's price (admin_price preferred, then price).
 */
export function resolvePayoutAmount(
  existingPayoutAmount: number | null | undefined,
  jobPrice: number | null | undefined,
): number {
  // Prefer an authoritative existing value when it is a positive number
  if (typeof existingPayoutAmount === 'number' && existingPayoutAmount > 0) {
    return existingPayoutAmount;
  }
  return calculatePayoutAmount(jobPrice);
}
