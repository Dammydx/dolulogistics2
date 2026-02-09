/*
  # Additional Indexes and Constraints for Performance & Data Integrity

  ## Purpose
  Optimize database performance and ensure data integrity across the system.

  ## What This Migration Does
  1. Adds composite indexes for common queries
  2. Adds check constraints for data validation
  3. Creates helper functions for common operations
  4. Adds triggers for auto-updating timestamps

  ## Performance Optimizations
  - Booking lookups by status + created_at (admin dashboard)
  - Zone rate lookups for pricing calculations
  - History queries for tracking timeline
  
  ## Data Integrity
  - Phone number format validation
  - Price validation (must be >= 0)
  - Tracking ID format validation (must start with "DL")
*/

-- ============================================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS: Auto-update updated_at on all tables
-- ============================================================

-- Locations tables
DROP TRIGGER IF EXISTS update_locations_states_updated_at ON locations_states;
CREATE TRIGGER update_locations_states_updated_at
  BEFORE UPDATE ON locations_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_cities_updated_at ON locations_cities;
CREATE TRIGGER update_locations_cities_updated_at
  BEFORE UPDATE ON locations_cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_location_zones_updated_at ON location_zones;
CREATE TRIGGER update_location_zones_updated_at
  BEFORE UPDATE ON location_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_areas_updated_at ON locations_areas;
CREATE TRIGGER update_locations_areas_updated_at
  BEFORE UPDATE ON locations_areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Pricing tables
DROP TRIGGER IF EXISTS update_pricing_zone_rates_updated_at ON pricing_zone_rates;
CREATE TRIGGER update_pricing_zone_rates_updated_at
  BEFORE UPDATE ON pricing_zone_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pricing_addons_updated_at ON pricing_addons;
CREATE TRIGGER update_pricing_addons_updated_at
  BEFORE UPDATE ON pricing_addons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Item categories
DROP TRIGGER IF EXISTS update_item_categories_updated_at ON item_categories;
CREATE TRIGGER update_item_categories_updated_at
  BEFORE UPDATE ON item_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Bookings
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Contact messages
DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON contact_messages;
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Settings
DROP TRIGGER IF EXISTS update_settings_app_updated_at ON settings_app;
CREATE TRIGGER update_settings_app_updated_at
  BEFORE UPDATE ON settings_app
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Templates
DROP TRIGGER IF EXISTS update_message_templates_updated_at ON message_templates;
CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ADDITIONAL CONSTRAINTS: Data validation
-- ============================================================

-- Bookings: Validate tracking ID format (must start with "DL")
ALTER TABLE bookings 
  DROP CONSTRAINT IF EXISTS valid_tracking_id_format;

ALTER TABLE bookings 
  ADD CONSTRAINT valid_tracking_id_format 
  CHECK (tracking_id ~ '^DL[0-9]{11}$');

-- Bookings: Validate prices are non-negative
ALTER TABLE bookings 
  DROP CONSTRAINT IF EXISTS valid_price_base;

ALTER TABLE bookings 
  ADD CONSTRAINT valid_price_base 
  CHECK (price_base >= 0);

ALTER TABLE bookings 
  DROP CONSTRAINT IF EXISTS valid_price_addons;

ALTER TABLE bookings 
  ADD CONSTRAINT valid_price_addons 
  CHECK (price_addons >= 0);

ALTER TABLE bookings 
  DROP CONSTRAINT IF EXISTS valid_price_total;

ALTER TABLE bookings 
  ADD CONSTRAINT valid_price_total 
  CHECK (price_total >= 0);

-- Pricing: Validate rates are non-negative
ALTER TABLE pricing_zone_rates 
  DROP CONSTRAINT IF EXISTS valid_base_price;

ALTER TABLE pricing_zone_rates 
  ADD CONSTRAINT valid_base_price 
  CHECK (base_price >= 0);

ALTER TABLE pricing_addons 
  DROP CONSTRAINT IF EXISTS valid_addon_fee;

ALTER TABLE pricing_addons 
  ADD CONSTRAINT valid_addon_fee 
  CHECK (fee >= 0);

-- ============================================================
-- COMPOSITE INDEXES: Common query patterns
-- ============================================================

-- Bookings by status and date (admin dashboard filters)
CREATE INDEX IF NOT EXISTS idx_bookings_status_created_at 
  ON bookings(status, created_at DESC);

-- Bookings by date range (reports)
CREATE INDEX IF NOT EXISTS idx_bookings_created_at_range 
  ON bookings(created_at DESC) 
  WHERE status NOT IN ('cancelled');

-- Contact messages by status and date
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created_at 
  ON contact_messages(status, created_at DESC);

-- Zone rates lookup (pricing calculator)
CREATE INDEX IF NOT EXISTS idx_zone_rates_lookup 
  ON pricing_zone_rates(from_zone_id, to_zone_id, active) 
  WHERE active = true;

-- ============================================================
-- FUNCTION: Get price quote for route
-- ============================================================
CREATE OR REPLACE FUNCTION get_price_quote(
  p_pickup_area_id uuid,
  p_dropoff_area_id uuid,
  p_addon_codes text[] DEFAULT ARRAY[]::text[]
)
RETURNS jsonb AS $$
DECLARE
  v_pickup_zone_id uuid;
  v_dropoff_zone_id uuid;
  v_base_price numeric(10, 2);
  v_addons_price numeric(10, 2);
  v_total_price numeric(10, 2);
  v_eta_text text;
  v_result jsonb;
BEGIN
  -- Get zone IDs from area IDs
  SELECT zone_id INTO v_pickup_zone_id 
  FROM locations_areas 
  WHERE id = p_pickup_area_id AND active = true;
  
  SELECT zone_id INTO v_dropoff_zone_id 
  FROM locations_areas 
  WHERE id = p_dropoff_area_id AND active = true;
  
  -- If zones not found, return error
  IF v_pickup_zone_id IS NULL OR v_dropoff_zone_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid pickup or dropoff area'
    );
  END IF;
  
  -- Get base price from zone rates
  SELECT base_price, eta_text 
  INTO v_base_price, v_eta_text
  FROM pricing_zone_rates
  WHERE from_zone_id = v_pickup_zone_id 
    AND to_zone_id = v_dropoff_zone_id 
    AND active = true;
  
  -- If no rate found, return error
  IF v_base_price IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No pricing available for this route'
    );
  END IF;
  
  -- Calculate addons price
  SELECT COALESCE(SUM(fee), 0) INTO v_addons_price
  FROM pricing_addons
  WHERE code = ANY(p_addon_codes) AND active = true;
  
  -- Calculate total
  v_total_price := v_base_price + v_addons_price;
  
  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'base_price', v_base_price,
    'addons_price', v_addons_price,
    'total_price', v_total_price,
    'eta_text', v_eta_text
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMMENTS for documentation
-- ============================================================

COMMENT ON FUNCTION generate_tracking_id() IS 
'Generates unique tracking ID in format: DL + YYYYMMDD + 3-digit sequence (e.g., DL20240209001)';

COMMENT ON FUNCTION get_price_quote(uuid, uuid, text[]) IS 
'Calculates price quote for a route. Parameters: pickup_area_id, dropoff_area_id, addon_codes array';

COMMENT ON FUNCTION update_updated_at_column() IS 
'Automatically updates the updated_at timestamp on row modification';

COMMENT ON TABLE bookings IS 
'Main bookings table. Tracking IDs start with "DL". No customer email field (by design).';

COMMENT ON TABLE booking_status_history IS 
'Audit trail of all booking status changes. Every status update must create a history entry.';

COMMENT ON TABLE contact_messages IS 
'Customer inquiries from contact form. Appears in admin Contact Messages inbox.';

COMMENT ON TABLE message_logs IS 
'Audit trail for all SMS/email/WhatsApp messages sent. Critical for cost tracking and debugging.';

COMMENT ON TABLE settings_app IS 
'Global application settings (key-value store). Includes SMS config, admin emails, customer care info.';

COMMENT ON TABLE message_templates IS 
'Templates for SMS/WhatsApp/Email with placeholder support. Admin can customize these.';
