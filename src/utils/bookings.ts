/**
 * BOOKING UTILITIES
 *
 * Helper functions for creating and managing bookings.
 *
 * TRACKING ID FORMAT:
 * - Starts with "DL" (Dolu Logistics)
 * - Followed by YYYYMMDD (date)
 * - Followed by 3-digit sequence number
 * - Example: DL20240209001, DL20240209002, etc.
 *
 * TRACKING ID GENERATION:
 * - Handled by database function generate_tracking_id()
 * - Automatically ensures uniqueness
 * - Called during booking creation
 */

import { supabase } from '../lib/supabase';
import type { Booking, BookingStatusHistory, ItemCategory } from '../types/database';

/**
 * Generate tracking ID on the database side
 * This ensures uniqueness and proper sequencing
 */
export async function generateTrackingId(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_tracking_id');

  if (error) {
    console.error('Error generating tracking ID:', error);
    throw new Error('Failed to generate tracking ID');
  }

  return data as string;
}

/**
 * Create a new booking
 *
 * IMPORTANT: This function:
 * 1. Generates tracking ID
 * 2. Creates booking record
 * 3. Creates initial status history entry
 * 4. Returns tracking ID for display to customer
 */
export interface CreateBookingData {
  // Sender
  sender_name: string;
  sender_phone: string;
  sender_whatsapp?: string;

  // Pickup
  pickup_state_id: string;
  pickup_city_id: string;
  pickup_area_id: string;
  pickup_address: string;
  pickup_landmark?: string;

  // Receiver
  receiver_name: string;
  receiver_phone: string;
  receiver_whatsapp?: string;

  // Dropoff
  dropoff_state_id: string;
  dropoff_city_id: string;
  dropoff_area_id: string;
  dropoff_address: string;
  dropoff_landmark?: string;

  // Item
  item_category_id: string;
  item_notes?: string;

  // Pricing
  price_base: number;
  price_addons: number;
  price_total: number;
  addons_selected?: string[];
}

export async function createBooking(data: CreateBookingData): Promise<string> {
  try {
    // Step 1: Generate tracking ID
    const trackingId = await generateTrackingId();

    // Step 2: Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          tracking_id: trackingId,
          sender_name: data.sender_name,
          sender_phone: data.sender_phone,
          sender_whatsapp: data.sender_whatsapp || null,
          pickup_state_id: data.pickup_state_id,
          pickup_city_id: data.pickup_city_id,
          pickup_area_id: data.pickup_area_id,
          pickup_address: data.pickup_address,
          pickup_landmark: data.pickup_landmark || null,
          receiver_name: data.receiver_name,
          receiver_phone: data.receiver_phone,
          receiver_whatsapp: data.receiver_whatsapp || null,
          dropoff_state_id: data.dropoff_state_id,
          dropoff_city_id: data.dropoff_city_id,
          dropoff_area_id: data.dropoff_area_id,
          dropoff_address: data.dropoff_address,
          dropoff_landmark: data.dropoff_landmark || null,
          item_category_id: data.item_category_id,
          item_notes: data.item_notes || null,
          price_base: data.price_base,
          price_addons: data.price_addons,
          price_total: data.price_total,
          addons_selected: data.addons_selected || null,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Step 3: Create initial status history entry
    // This is what shows on the Track Parcel page
    const { error: historyError } = await supabase
      .from('booking_status_history')
      .insert([
        {
          booking_id: booking.id,
          status: 'pending',
          note: 'Booking received. Customer care will call you shortly.',
          created_by: 'system',
        },
      ]);

    if (historyError) {
      console.error('Error creating history entry:', historyError);
      // Don't fail the booking if history fails
    }

    return trackingId;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw new Error('Failed to create booking. Please try again.');
  }
}

/**
 * Fetch booking by tracking ID (for Track Parcel page)
 */
export async function fetchBookingByTrackingId(trackingId: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('tracking_id', trackingId.trim().toUpperCase())
    .maybeSingle();

  if (error) {
    console.error('Error fetching booking:', error);
    return null;
  }

  return data;
}

/**
 * Fetch booking history (for Track Parcel timeline)
 */
export async function fetchBookingHistory(bookingId: string): Promise<BookingStatusHistory[]> {
  const { data, error } = await supabase
    .from('booking_status_history')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching booking history:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch all item categories (for Request Pickup form)
 */
export async function fetchItemCategories(): Promise<ItemCategory[]> {
  const { data, error } = await supabase
    .from('item_categories')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Get status label for display
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    not_accepted: 'Not Accepted',
    in_progress: 'In Progress',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return labels[status] || status;
}

/**
 * Get status color for display
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-blue-100 text-blue-800',
    not_accepted: 'bg-red-100 text-red-800',
    in_progress: 'bg-primary-100 text-primary-800',
    delivered: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
}
