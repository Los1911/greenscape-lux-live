/**
 * AI-Powered Quote Pricing Estimator
 * Calculates intelligent price ranges based on services, property size, and regional data
 * 
 * NOTE: This is for INTERNAL admin use only - estimates are NOT shown to customers.
 * Customers receive professional estimates after site evaluation.
 */

// Service base pricing (in dollars)
// Note: 'Lawn Maintenance' consolidates former Lawn Mowing, Lawn Care and Maintenance, Edging and Borders
const SERVICE_BASE_PRICES: Record<string, number> = {
  'Lawn Maintenance': 65,
  'Hedge and Shrub Trimming': 65,
  'Mulch Installation': 85,
  'Rock Installation': 120,
  'Sod Installation': 180,
  'Flower Bed Installation and Design': 150,
  'Weed Control': 50,
  'Full Landscape Renovation': 800,
  'Hardscaping and Custom Features': 600,
  'Drainage Solutions': 450,
  'Retaining Walls': 700,
  'Irrigation System Installation': 500,
  'Tree Removal': 350,
  'Tree Trimming & Pruning': 200,
  'Stump Grinding': 150,
  'Land Clearing': 600,
  'Property Flip Cleanups (Real Estate Ready)': 400,
  'Airbnb / Rental Property Lawn Services': 120,
  'HOA or Multi-Property Contracts': 500,
  'Weekly or Biweekly Recurring Maintenance': 180,
  'Seasonal Cleanups (Fall/Spring)': 150,
  'Leaf Removal': 95,
  'Snow Removal': 85,
  'Salting / De-icing': 55,
  'Winter Yard Prep': 120,
  'Pressure Washing': 175,
  'Gutter Cleaning': 125,
  'Pest Control (via partners)': 100,
  'Yard Waste Disposal': 75,
  // Legacy service names for backwards compatibility with existing quotes
  'Lawn Mowing': 45,
  'Lawn Care and Maintenance': 65,
  'Edging and Borders': 35,
};


// Property size multipliers based on lot size dropdown values
const LOT_SIZE_MULTIPLIERS: Record<string, number> = {
  'under-quarter': 0.75,   // Under ¼ acre
  'quarter-half': 1.0,     // ¼ – ½ acre
  'half-one': 1.4,         // ½ – 1 acre
  'over-one': 2.0,         // 1+ acre
};

// Legacy property size multipliers (for backwards compatibility)
const SIZE_MULTIPLIERS: Record<string, number> = {
  'small': 0.8,    // < 5000 sq ft
  'medium': 1.0,   // 5000-10000 sq ft
  'large': 1.3,    // 10000-20000 sq ft
  'xlarge': 1.7,   // > 20000 sq ft
};

// Seasonal demand modifiers
const SEASONAL_MODIFIERS: Record<string, number> = {
  'spring': 1.15,  // High demand (March-May)
  'summer': 1.10,  // Peak season (June-August)
  'fall': 1.05,    // Moderate (September-November)
  'winter': 0.90,  // Low demand (December-February)
};

// Regional cost adjustments (by ZIP code prefix)
const REGIONAL_MODIFIERS: Record<string, number> = {
  '100': 1.25, // NYC area
  '900': 1.20, // California
  '770': 1.10, // Georgia
  '750': 1.05, // Texas
  '282': 1.08, // Charlotte, NC
  '283': 1.08, // Charlotte suburbs
  // Default: 1.0
};

interface PricingInput {
  services: string[];
  propertySize?: string;
  zipCode?: string;
  preferredDate?: string;
  comments?: string;
}

interface PriceEstimate {
  minPrice: number;
  maxPrice: number;
  suggestedPrice: number;
  breakdown: Array<{
    service: string;
    basePrice: number;
    adjustedPrice: number;
  }>;
  modifiers: {
    size: number;
    seasonal: number;
    regional: number;
  };
  // Flag indicating this is for internal use only
  isInternalEstimate: boolean;
}

/**
 * Extract property size from comments or address (legacy fallback)
 */
function estimatePropertySize(comments?: string, address?: string): string {
  const text = `${comments} ${address}`.toLowerCase();
  
  if (text.match(/\b(small|tiny|compact|under 5000)\b/)) return 'small';
  if (text.match(/\b(large|big|spacious|over 10000|acre)\b/)) return 'large';
  if (text.match(/\b(huge|massive|estate|over 20000|acres)\b/)) return 'xlarge';
  
  return 'medium'; // Default
}

/**
 * Determine season from date
 */
function getSeason(dateString?: string): string {
  if (!dateString) {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
  
  const month = new Date(dateString).getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

/**
 * Extract ZIP code from address
 */
function extractZipPrefix(address?: string): string {
  const zipMatch = address?.match(/\b(\d{5})\b/);
  return zipMatch ? zipMatch[1].substring(0, 3) : '000';
}

/**
 * Calculate intelligent price estimate (INTERNAL USE ONLY)
 * This estimate is used for admin review and bid suggestions,
 * NOT displayed to customers.
 */
export function calculatePriceEstimate(input: PricingInput): PriceEstimate {
  console.log('[PRICING] Calculating INTERNAL estimate for:', input);
  
  // Determine size multiplier - prefer new lot size format, fall back to legacy
  let sizeMultiplier = 1.0;
  if (input.propertySize && LOT_SIZE_MULTIPLIERS[input.propertySize]) {
    sizeMultiplier = LOT_SIZE_MULTIPLIERS[input.propertySize];
  } else {
    const legacySize = estimatePropertySize(input.comments);
    sizeMultiplier = SIZE_MULTIPLIERS[legacySize] || 1.0;
  }
  
  const season = getSeason(input.preferredDate);
  const seasonalMultiplier = SEASONAL_MODIFIERS[season] || 1.0;
  
  const zipPrefix = extractZipPrefix(input.zipCode || input.comments);
  const regionalMultiplier = REGIONAL_MODIFIERS[zipPrefix] || 1.0;
  
  console.log('[PRICING] Modifiers:', {
    propertySize: input.propertySize,
    sizeMultiplier,
    season,
    seasonalMultiplier,
    zipPrefix,
    regionalMultiplier
  });
  
  // Calculate per-service pricing
  const breakdown = input.services.map(service => {
    const basePrice = SERVICE_BASE_PRICES[service] || 100; // Default for custom services
    const adjustedPrice = Math.round(
      basePrice * sizeMultiplier * seasonalMultiplier * regionalMultiplier
    );
    
    return { service, basePrice, adjustedPrice };
  });
  
  // Calculate total range
  const totalBase = breakdown.reduce((sum, item) => sum + item.adjustedPrice, 0);
  const minPrice = Math.round(totalBase * 0.85); // 15% below
  const maxPrice = Math.round(totalBase * 1.15); // 15% above
  const suggestedPrice = Math.round((minPrice + maxPrice) / 2);
  
  console.log('[PRICING] INTERNAL estimate (not shown to customer):', {
    minPrice,
    maxPrice,
    suggestedPrice
  });
  
  return {
    minPrice,
    maxPrice,
    suggestedPrice,
    breakdown,
    modifiers: {
      size: sizeMultiplier,
      seasonal: seasonalMultiplier,
      regional: regionalMultiplier
    },
    isInternalEstimate: true
  };
}

/**
 * Format price for display (ADMIN USE ONLY)
 */
export function formatPrice(price: number): string {
  return `$${price.toLocaleString()}`;
}

/**
 * Format price range for display (ADMIN USE ONLY)
 */
export function formatPriceRange(minPrice: number, maxPrice: number): string {
  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
}
