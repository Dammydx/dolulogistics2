/**
 * DOLU LOGISTICS - DATABASE TYPES
 *
 * TypeScript type definitions for all database tables.
 * Generated from Supabase schema.
 *
 * IMPORTANT: Keep these in sync with database migrations!
 */

// ============================================================
// LOCATION TYPES
// ============================================================

export interface State {
  id: string;
  name: string;
  code: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  state_id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Zone {
  id: string;
  city_id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  city_id: string;
  zone_id: string | null;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// PRICING TYPES
// ============================================================

export interface ZoneRate {
  id: string;
  from_zone_id: string;
  to_zone_id: string;
  base_price: number;
  eta_text: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Addon {
  id: string;
  name: string;
  code: string;
  description: string | null;
  fee: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * PRICING CALCULATION
 *
 * How pricing works:
 * 1. Customer selects pickup_area_id and dropoff_area_id
 * 2. System looks up zone_id for each area
 * 3. System finds ZoneRate where from_zone_id + to_zone_id match
 * 4. base_price comes from ZoneRate
 * 5. addons_price = sum of selected addon fees
 * 6. total_price = base_price + addons_price
 */
export interface PriceQuote {
  success: boolean;
  base_price: number;
  addons_price: number;
  total_price: number;
  eta_text: string | null;
  error?: string;
}

// ============================================================
// ITEM CATEGORY TYPES
// ============================================================

export interface ItemCategory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  requires_notes: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// BOOKING TYPES
// ============================================================

/**
 * Booking status flow:
 * pending → confirmed → in_progress → delivered
 *        ↘ not_accepted
 *        ↘ cancelled
 */
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'not_accepted'
  | 'in_progress'
  | 'delivered'
  | 'cancelled';

/**
 * MAIN BOOKING RECORD
 *
 * IMPORTANT NOTES:
 * - NO customer email field (by design)
 * - tracking_id starts with "DL" (e.g., DL20240209001)
 * - whatsapp fields are optional
 * - price_snapshot captures pricing at booking time
 * - rider fields are simple text (no rider table)
 */
export interface Booking {
  id: string;

  // Tracking
  tracking_id: string;

  // Sender (NO EMAIL)
  sender_name: string;
  sender_phone: string;
  sender_whatsapp: string | null;

  // Pickup location
  pickup_state_id: string | null;
  pickup_city_id: string | null;
  pickup_area_id: string | null;
  pickup_address: string;
  pickup_landmark: string | null;

  // Receiver (NO EMAIL)
  receiver_name: string;
  receiver_phone: string;
  receiver_whatsapp: string | null;

  // Dropoff location
  dropoff_state_id: string | null;
  dropoff_city_id: string | null;
  dropoff_area_id: string | null;
  dropoff_address: string;
  dropoff_landmark: string | null;

  // Item
  item_category_id: string | null;
  item_notes: string | null;

  // Pricing snapshot
  price_base: number;
  price_addons: number;
  price_total: number;
  addons_selected: string[] | null;

  // Rider (text fields only)
  rider_name: string | null;
  rider_phone: string | null;

  // Status
  status: BookingStatus;

  // Admin notes
  admin_notes: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * BOOKING STATUS HISTORY
 *
 * Every status change MUST create a history entry.
 * This powers the tracking timeline on the Track Parcel page.
 *
 * Example entries:
 * - "Booking received. Customer care will call you shortly." (system, auto-created)
 * - "Booking confirmed. Rider assigned: John Doe" (admin)
 * - "Parcel picked up and in transit" (admin)
 * - "Out for delivery" (admin)
 * - "Delivered successfully" (admin)
 */
export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  status: BookingStatus;
  note: string;
  created_by: string; // 'admin' | 'system'
  created_at: string;
}

// ============================================================
// CONTACT MESSAGE TYPES
// ============================================================

export type ContactMessageStatus = 'new' | 'in_progress' | 'resolved' | 'spam';

/**
 * CONTACT MESSAGES
 *
 * Submitted from Contact page.
 * Appear in admin "Contact Messages" inbox.
 * Optional: Can trigger email to admin (if enabled in settings).
 */
export interface ContactMessage {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  subject: string | null;
  message: string;
  status: ContactMessageStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// SETTINGS TYPES
// ============================================================

/**
 * APPLICATION SETTINGS (Key-Value Store)
 *
 * All settings are stored as JSONB values.
 * Type-safe access via helper functions.
 */
export interface AppSetting {
  key: string;
  value: any; // JSONB - parse as needed
  description: string | null;
  updated_at: string;
}

/**
 * SETTINGS KEYS (for type safety)
 */
export type SettingKey =
  | 'customer_care_phone'
  | 'customer_care_whatsapp'
  | 'business_hours_text'
  | 'admin_emails'
  | 'email_on_new_booking'
  | 'email_on_new_contact_message'
  | 'sms_enabled'
  | 'sms_send_mode'
  | 'sms_provider'
  | 'sms_api_key'
  | 'sms_sender_name';

/**
 * SMS SEND MODES
 *
 * manual_only: Admin must click "Send Tracking SMS" button (default)
 * auto_on_in_progress: Auto-send when status changes to 'in_progress'
 *
 * WHY MANUAL BY DEFAULT:
 * - Prevents accidental SMS costs
 * - Admin has full control
 * - Customer care calls first, then sends SMS if needed
 */
export type SmsSendMode = 'manual_only' | 'auto_on_in_progress';

// ============================================================
// MESSAGE TEMPLATE TYPES
// ============================================================

export type MessageTemplateType = 'sms' | 'whatsapp' | 'email';

/**
 * MESSAGE TEMPLATES
 *
 * Templates support placeholders:
 * {tracking_id}, {sender_name}, {receiver_name}, {status},
 * {pickup_area}, {dropoff_area}, {rider_name}, {customer_care_phone}
 *
 * Admin can edit these in Templates page.
 */
export interface MessageTemplate {
  id: string;
  name: string;
  type: MessageTemplateType;
  code: string;
  subject: string | null;
  body: string;
  placeholders: string[] | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// MESSAGE LOG TYPES
// ============================================================

export type MessageLogStatus = 'pending' | 'sent' | 'failed';

/**
 * MESSAGE LOGS
 *
 * Audit trail for all SMS/Email/WhatsApp sent.
 * Critical for:
 * - Cost tracking (SMS charges)
 * - Debugging delivery issues
 * - Compliance
 *
 * IMPORTANT: Logs are append-only (no updates/deletes)
 */
export interface MessageLog {
  id: string;
  message_type: MessageTemplateType;
  recipient: string;
  booking_id: string | null;
  contact_message_id: string | null;
  template_code: string | null;
  subject: string | null;
  body: string;
  status: MessageLogStatus;
  error_message: string | null;
  provider_response: any | null;
  cost: number;
  triggered_by: string; // 'admin' | 'system' | 'auto'
  created_at: string;
}

// ============================================================
// UTILITY TYPES
// ============================================================

/**
 * For dropdown selections in forms
 */
export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * Extended booking with related data (for admin view)
 */
export interface BookingWithDetails extends Booking {
  pickup_area?: Area;
  dropoff_area?: Area;
  item_category?: ItemCategory;
  history?: BookingStatusHistory[];
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  pending: number;
  confirmed: number;
  not_accepted: number;
  in_progress: number;
  delivered: number;
  cancelled: number;
  total: number;
}
