/**
 * PRICING UTILITIES
 *
 * Helper functions for calculating delivery prices.
 * Used by Get Quote and Request Pickup pages.
 *
 * PRICING LOGIC FLOW:
 * 1. Customer selects pickup_area_id and dropoff_area_id
 * 2. System looks up zone_id for each area from locations_areas table
 * 3. System finds pricing_zone_rates where from_zone_id + to_zone_id match
 * 4. base_price comes from zone_rates.base_price
 * 5. Customer selects optional add-ons (Fragile, Express)
 * 6. addons_price = sum of selected addon fees from pricing_addons table
 * 7. total_price = base_price + addons_price
 * 8. Return quote with breakdown
 *
 * IMPORTANT: All calculations happen client-side using database lookups.
 * The calculated price is saved as a "snapshot" when booking is created.
 * This ensures historical accuracy even if prices change later.
 */

import { supabase } from '../lib/supabase';
import type { PriceQuote, Addon } from '../types/database';

/**
 * Calculate price quote for a route
 *
 * @param pickupAreaId - Pickup area UUID
 * @param dropoffAreaId - Dropoff area UUID
 * @param addonCodes - Array of addon codes (e.g., ['FRAGILE', 'EXPRESS'])
 * @returns Price quote with breakdown
 */
export async function calculatePriceQuote(
  pickupAreaId: string,
  dropoffAreaId: string,
  addonCodes: string[] = []
): Promise<PriceQuote> {
  try {
    // Step 1: Get zone IDs for both areas
    const { data: pickupArea, error: pickupError } = await supabase
      .from('locations_areas')
      .select('zone_id')
      .eq('id', pickupAreaId)
      .single();

    if (pickupError || !pickupArea?.zone_id) {
      return {
        success: false,
        base_price: 0,
        addons_price: 0,
        total_price: 0,
        eta_text: null,
        error: 'Invalid pickup area',
      };
    }

    const { data: dropoffArea, error: dropoffError } = await supabase
      .from('locations_areas')
      .select('zone_id')
      .eq('id', dropoffAreaId)
      .single();

    if (dropoffError || !dropoffArea?.zone_id) {
      return {
        success: false,
        base_price: 0,
        addons_price: 0,
        total_price: 0,
        eta_text: null,
        error: 'Invalid dropoff area',
      };
    }

    // Step 2: Get base price from zone rates
    const { data: zoneRate, error: rateError } = await supabase
      .from('pricing_zone_rates')
      .select('base_price, eta_text')
      .eq('from_zone_id', pickupArea.zone_id)
      .eq('to_zone_id', dropoffArea.zone_id)
      .eq('active', true)
      .maybeSingle();

    if (rateError || !zoneRate) {
      return {
        success: false,
        base_price: 0,
        addons_price: 0,
        total_price: 0,
        eta_text: null,
        error: 'No pricing available for this route',
      };
    }

    const basePrice = parseFloat(zoneRate.base_price.toString());

    // Step 3: Calculate add-ons price (if any selected)
    let addonsPrice = 0;

    if (addonCodes.length > 0) {
      const { data: addons, error: addonsError } = await supabase
        .from('pricing_addons')
        .select('fee')
        .in('code', addonCodes)
        .eq('active', true);

      if (!addonsError && addons) {
        addonsPrice = addons.reduce((sum, addon) => sum + parseFloat(addon.fee.toString()), 0);
      }
    }

    // Step 4: Calculate total
    const totalPrice = basePrice + addonsPrice;

    return {
      success: true,
      base_price: basePrice,
      addons_price: addonsPrice,
      total_price: totalPrice,
      eta_text: zoneRate.eta_text,
    };
  } catch (error) {
    console.error('Error calculating price quote:', error);
    return {
      success: false,
      base_price: 0,
      addons_price: 0,
      total_price: 0,
      eta_text: null,
      error: 'Failed to calculate price. Please try again.',
    };
  }
}

/**
 * Fetch all available add-ons
 */
export async function fetchAddons(): Promise<Addon[]> {
  const { data, error } = await supabase
    .from('pricing_addons')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Format price for display
 *
 * @param price - Price in Naira
 * @returns Formatted string (e.g., "₦1,200.00")
 */
export function formatPrice(price: number): string {
  return `₦${price.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Validate that pickup and dropoff are different
 */
export function validateRoute(pickupAreaId: string, dropoffAreaId: string): boolean {
  if (!pickupAreaId || !dropoffAreaId) return false;

  // Allow same area for now (admin can set pricing for same zone)
  return true;
}
