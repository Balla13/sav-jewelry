/**
 * Centralized shipping calculation for domestic (US) and international orders.
 * - US: free shipping when 2+ items OR subtotal >= $299; otherwise domestic flat fee.
 * - Non-US: always international flat rate (no free shipping promotion).
 */

export type ShippingResult = {
  /** Shipping amount in cents (for Stripe and APIs). */
  shippingCents: number;
  /** Shipping amount in USD (for display). */
  shippingUsd: number;
  /** True when destination is outside the United States. */
  isInternational: boolean;
  /** Whether free shipping rule applied (US only). */
  isFreeShipping: boolean;
};

export type ComputeShippingParams = {
  /** ISO 3166-1 alpha-2 country code (e.g. "US", "BR"). */
  countryCode: string;
  /** Cart subtotal in cents. */
  subtotalCents: number;
  /** Total number of items in cart. */
  totalQuantity: number;
  /** Domestic (US) flat fee in USD when free shipping is not met. */
  domesticFeeUsd: number;
  /** International flat fee in USD (always applied for non-US). */
  internationalFeeUsd: number;
};

const US_COUNTRY_CODES = ["US", "USA"];

/**
 * Returns whether the destination is the United States (domestic).
 */
export function isDomestic(countryCode: string): boolean {
  const normalized = String(countryCode || "").trim().toUpperCase();
  return US_COUNTRY_CODES.includes(normalized);
}

/**
 * Computes shipping amount and metadata from cart and destination.
 * Use this in all APIs and frontend for consistent behavior.
 */
export function computeShipping(params: ComputeShippingParams): ShippingResult {
  const {
    countryCode,
    subtotalCents,
    totalQuantity,
    domesticFeeUsd,
    internationalFeeUsd,
  } = params;

  const domestic = isDomestic(countryCode);
  const domesticFeeCents = Math.round((Number(domesticFeeUsd) || 0) * 100);
  const internationalFeeCents = Math.round((Number(internationalFeeUsd) || 0) * 100);

  if (domestic) {
    // Free shipping only applies to US: 2+ items OR subtotal >= $299
    const qualifiesFreeShipping = totalQuantity >= 2 || subtotalCents >= 29900;
    const shippingCents = qualifiesFreeShipping ? 0 : Math.max(0, domesticFeeCents);
    return {
      shippingCents,
      shippingUsd: shippingCents / 100,
      isInternational: false,
      isFreeShipping: qualifiesFreeShipping,
    };
  }

  // International: always flat rate, no free shipping
  const shippingCents = Math.max(0, internationalFeeCents);
  return {
    shippingCents,
    shippingUsd: shippingCents / 100,
    isInternational: true,
    isFreeShipping: false,
  };
}
