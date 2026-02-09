/*
  # Create Pricing Tables for Zone-Based Pricing System

  ## Purpose
  These tables store the pricing configuration that admins manage.
  - Zone-to-zone rates (e.g., Zone A → Zone B = ₦500)
  - Add-on fees (Fragile, Express)
  - Used by Get Quote and Request Pickup to calculate prices

  ## Tables Created
  1. `pricing_zone_rates` - Base prices between zones
  2. `pricing_addons` - Additional service fees (Fragile, Express)

  ## Security
  - RLS enabled
  - Public can READ (for price calculations)
  - Only authenticated users (admin) can INSERT/UPDATE/DELETE

  ## Pricing Logic Flow
  1. Customer selects pickup area + dropoff area
  2. System looks up: area → zone
  3. System finds zone_rate where from_zone + to_zone match
  4. Adds any selected add-ons (fragile, express)
  5. Returns total price

  ## Important Notes
  - Rates are directional (Zone A → Zone B may differ from Zone B → Zone A)
  - Each rate has an optional ETA text for customer display
  - Inactive rates are hidden from public queries
*/

-- ============================================================
-- TABLE: pricing_zone_rates
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing_zone_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_zone_id uuid NOT NULL REFERENCES location_zones(id) ON DELETE CASCADE,
  to_zone_id uuid NOT NULL REFERENCES location_zones(id) ON DELETE CASCADE,
  base_price numeric(10, 2) NOT NULL DEFAULT 0,
  eta_text text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(from_zone_id, to_zone_id)
);

-- ============================================================
-- TABLE: pricing_addons
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  fee numeric(10, 2) NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE pricing_zone_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_addons ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: Public can read, only authenticated can modify
-- ============================================================

CREATE POLICY "Public can view active zone rates"
  ON pricing_zone_rates FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Authenticated users can manage zone rates"
  ON pricing_zone_rates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view active addons"
  ON pricing_addons FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Authenticated users can manage addons"
  ON pricing_addons FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SEED DATA: Sample zone rates for Port Harcourt
-- ============================================================

DO $$
DECLARE
  v_zone_a_id uuid;
  v_zone_b_id uuid;
  v_zone_c_id uuid;
BEGIN
  SELECT z.id INTO v_zone_a_id 
  FROM location_zones z 
  JOIN locations_cities c ON z.city_id = c.id 
  WHERE c.name = 'Port Harcourt' AND z.name = 'Zone A';

  SELECT z.id INTO v_zone_b_id 
  FROM location_zones z 
  JOIN locations_cities c ON z.city_id = c.id 
  WHERE c.name = 'Port Harcourt' AND z.name = 'Zone B';

  SELECT z.id INTO v_zone_c_id 
  FROM location_zones z 
  JOIN locations_cities c ON z.city_id = c.id 
  WHERE c.name = 'Port Harcourt' AND z.name = 'Zone C';

  IF v_zone_a_id IS NOT NULL AND v_zone_b_id IS NOT NULL AND v_zone_c_id IS NOT NULL THEN
    INSERT INTO pricing_zone_rates (from_zone_id, to_zone_id, base_price, eta_text, active) VALUES
      (v_zone_a_id, v_zone_a_id, 800.00, '30-45 minutes', true),
      (v_zone_a_id, v_zone_b_id, 1200.00, '45-60 minutes', true),
      (v_zone_a_id, v_zone_c_id, 1500.00, '60-90 minutes', true),
      (v_zone_b_id, v_zone_a_id, 1200.00, '45-60 minutes', true),
      (v_zone_b_id, v_zone_b_id, 1000.00, '30-45 minutes', true),
      (v_zone_b_id, v_zone_c_id, 1300.00, '45-60 minutes', true),
      (v_zone_c_id, v_zone_a_id, 1500.00, '60-90 minutes', true),
      (v_zone_c_id, v_zone_b_id, 1300.00, '45-60 minutes', true),
      (v_zone_c_id, v_zone_c_id, 1200.00, '30-60 minutes', true)
    ON CONFLICT (from_zone_id, to_zone_id) DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- SEED DATA: Add-ons (Fragile, Express)
-- ============================================================

INSERT INTO pricing_addons (name, code, description, fee, active) VALUES
  ('Fragile Handling', 'FRAGILE', 'Extra care for delicate items', 300.00, true),
  ('Express Delivery', 'EXPRESS', 'Priority delivery service', 500.00, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_zone_rates_from_zone ON pricing_zone_rates(from_zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_rates_to_zone ON pricing_zone_rates(to_zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_rates_active ON pricing_zone_rates(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_addons_code ON pricing_addons(code);
CREATE INDEX IF NOT EXISTS idx_addons_active ON pricing_addons(active) WHERE active = true;
