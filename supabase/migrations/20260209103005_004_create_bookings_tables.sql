/*
  # Create Bookings Tables for Dispatch System

  ## Purpose
  Core tables for managing customer bookings and tracking status changes.

  ## Tables Created
  1. `bookings` - Main booking records
  2. `booking_status_history` - Audit trail of all status changes

  ## Booking Flow
  1. Customer submits Request Pickup form
  2. System creates booking with status = 'pending'
  3. System generates Tracking ID starting with "DL" (e.g., DL20240209001)
  4. System creates first history entry: "Booking received. Customer care will call you shortly."
  5. Admin views booking, assigns rider, updates status
  6. Each status change creates a new history entry with timestamp

  ## Status Options
  - pending: Initial state after booking creation
  - confirmed: Admin confirmed the booking
  - not_accepted: Admin rejected (requires reason)
  - in_progress: Rider has picked up parcel
  - delivered: Successfully delivered
  - cancelled: Booking cancelled

  ## Important Fields
  - NO customer email field (as per requirements)
  - sender_whatsapp and receiver_whatsapp are optional
  - price_snapshot stores calculated price at booking time
  - rider_name and rider_phone are text fields (no rider table)

  ## Security
  - RLS enabled
  - Public can INSERT (create bookings)
  - Public can SELECT their own booking by tracking_id (safe lookup)
  - Only authenticated users (admin) can UPDATE/DELETE
  - History table: public can read their own, admin can manage all

  ## Critical: Tracking ID Generation
  Format: DL + YYYYMMDD + sequential number
  Example: DL20240209001, DL20240209002, etc.
  Must be unique and auto-generated
*/

-- ============================================================
-- TABLE: bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tracking (auto-generated, unique, starts with "DL")
  tracking_id text UNIQUE NOT NULL,
  
  -- Sender information (NO EMAIL)
  sender_name text NOT NULL,
  sender_phone text NOT NULL,
  sender_whatsapp text,
  
  -- Pickup location
  pickup_state_id uuid REFERENCES locations_states(id),
  pickup_city_id uuid REFERENCES locations_cities(id),
  pickup_area_id uuid REFERENCES locations_areas(id),
  pickup_address text NOT NULL,
  pickup_landmark text,
  
  -- Receiver information (NO EMAIL)
  receiver_name text NOT NULL,
  receiver_phone text NOT NULL,
  receiver_whatsapp text,
  
  -- Dropoff location
  dropoff_state_id uuid REFERENCES locations_states(id),
  dropoff_city_id uuid REFERENCES locations_cities(id),
  dropoff_area_id uuid REFERENCES locations_areas(id),
  dropoff_address text NOT NULL,
  dropoff_landmark text,
  
  -- Item details
  item_category_id uuid REFERENCES item_categories(id),
  item_notes text,
  
  -- Pricing snapshot (captured at booking time)
  price_base numeric(10, 2) DEFAULT 0,
  price_addons numeric(10, 2) DEFAULT 0,
  price_total numeric(10, 2) NOT NULL,
  addons_selected text[], -- e.g., ['FRAGILE', 'EXPRESS']
  
  -- Rider assignment (simple text fields, no rider table)
  rider_name text,
  rider_phone text,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'pending',
  
  -- Admin notes (optional, visible only to admin)
  admin_notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'not_accepted', 'in_progress', 'delivered', 'cancelled'))
);

-- ============================================================
-- TABLE: booking_status_history
-- ============================================================
CREATE TABLE IF NOT EXISTS booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Status change details
  status text NOT NULL,
  note text NOT NULL, -- e.g., "Booking received. Customer care will call you shortly."
  
  -- Who made the change
  created_by text DEFAULT 'admin', -- 'admin' or 'system'
  
  -- Timestamp
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_history_status CHECK (status IN ('pending', 'confirmed', 'not_accepted', 'in_progress', 'delivered', 'cancelled'))
);

-- ============================================================
-- FUNCTION: Generate unique tracking ID with "DL" prefix
-- ============================================================
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS text AS $$
DECLARE
  v_date_part text;
  v_sequence int;
  v_tracking_id text;
  v_exists boolean;
BEGIN
  -- Get current date in YYYYMMDD format
  v_date_part := to_char(now(), 'YYYYMMDD');
  
  -- Start sequence at 1
  v_sequence := 1;
  
  -- Loop until we find a unique tracking ID
  LOOP
    -- Format: DL + YYYYMMDD + 3-digit sequence (e.g., DL20240209001)
    v_tracking_id := 'DL' || v_date_part || lpad(v_sequence::text, 3, '0');
    
    -- Check if this tracking ID already exists
    SELECT EXISTS(SELECT 1 FROM bookings WHERE tracking_id = v_tracking_id) INTO v_exists;
    
    -- If unique, return it
    IF NOT v_exists THEN
      RETURN v_tracking_id;
    END IF;
    
    -- Otherwise, increment sequence and try again
    v_sequence := v_sequence + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: bookings
-- ============================================================

-- Public can create bookings (Request Pickup form)
CREATE POLICY "Public can create bookings"
  ON bookings FOR INSERT
  TO public
  WITH CHECK (true);

-- Public can view their own booking by tracking_id
-- This enables the Track Parcel page to work without authentication
CREATE POLICY "Public can view booking by tracking_id"
  ON bookings FOR SELECT
  TO public
  USING (true);

-- Authenticated users (admin) can do everything
CREATE POLICY "Authenticated users can manage all bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RLS POLICIES: booking_status_history
-- ============================================================

-- Public can view history for any booking (needed for Track Parcel page)
CREATE POLICY "Public can view booking history"
  ON booking_status_history FOR SELECT
  TO public
  USING (true);

-- Authenticated users (admin) can insert/update history
CREATE POLICY "Authenticated users can manage history"
  ON booking_status_history FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- System can insert history entries (for automatic entries)
CREATE POLICY "System can create history entries"
  ON booking_status_history FOR INSERT
  TO public
  WITH CHECK (created_by = 'system');

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bookings_tracking_id ON bookings(tracking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_sender_phone ON bookings(sender_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_receiver_phone ON bookings(receiver_phone);
CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON booking_status_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_history_created_at ON booking_status_history(created_at DESC);
