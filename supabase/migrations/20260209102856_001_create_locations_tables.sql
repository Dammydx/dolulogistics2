/*
  # Create Locations Tables for Zone-Based Pricing System

  ## Purpose
  These tables enable the zone-based pricing model for Dolu Logistics.
  - States/Cities/Areas form the location hierarchy
  - Zones group areas for pricing calculations
  - This structure powers the Get Quote and Request Pickup dropdowns

  ## Tables Created
  1. `locations_states` - Nigerian states
  2. `locations_cities` - Cities within states
  3. `location_zones` - Pricing zones (Zone A, B, C, etc.) per city
  4. `locations_areas` - Specific areas assigned to zones

  ## Security
  - RLS enabled on all tables
  - Public can READ (for customer dropdowns)
  - Only authenticated users (admin) can INSERT/UPDATE/DELETE

  ## Notes
  - Areas are assigned to zones for pricing calculations
  - When customer selects pickup/dropoff area → system looks up zone → calculates rate
*/

-- ============================================================
-- TABLE: locations_states
-- ============================================================
CREATE TABLE IF NOT EXISTS locations_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- TABLE: locations_cities
-- ============================================================
CREATE TABLE IF NOT EXISTS locations_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id uuid NOT NULL REFERENCES locations_states(id) ON DELETE CASCADE,
  name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(state_id, name)
);

-- ============================================================
-- TABLE: location_zones
-- ============================================================
CREATE TABLE IF NOT EXISTS location_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES locations_cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(city_id, name)
);

-- ============================================================
-- TABLE: locations_areas
-- ============================================================
CREATE TABLE IF NOT EXISTS locations_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES locations_cities(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES location_zones(id) ON DELETE SET NULL,
  name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(city_id, name)
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE locations_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations_areas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: Public can read, only authenticated can modify
-- ============================================================

CREATE POLICY "Public can view active states"
  ON locations_states FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Authenticated users can manage states"
  ON locations_states FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view active cities"
  ON locations_cities FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Authenticated users can manage cities"
  ON locations_cities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view active zones"
  ON location_zones FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Authenticated users can manage zones"
  ON location_zones FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view active areas"
  ON locations_areas FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Authenticated users can manage areas"
  ON locations_areas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SEED DATA: Rivers State and Port Harcourt with sample areas
-- ============================================================

INSERT INTO locations_states (name, code, active)
VALUES ('Rivers', 'NG-RI', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO locations_cities (state_id, name, active)
SELECT id, 'Port Harcourt', true
FROM locations_states
WHERE code = 'NG-RI'
ON CONFLICT (state_id, name) DO NOTHING;

DO $$
DECLARE
  v_city_id uuid;
BEGIN
  SELECT id INTO v_city_id FROM locations_cities WHERE name = 'Port Harcourt';

  IF v_city_id IS NOT NULL THEN
    INSERT INTO location_zones (city_id, name, description, active) VALUES
      (v_city_id, 'Zone A', 'City center and surrounding areas', true),
      (v_city_id, 'Zone B', 'Mid-range areas', true),
      (v_city_id, 'Zone C', 'Outer areas', true)
    ON CONFLICT (city_id, name) DO NOTHING;
  END IF;
END $$;

DO $$
DECLARE
  v_city_id uuid;
  v_zone_a_id uuid;
  v_zone_b_id uuid;
  v_zone_c_id uuid;
BEGIN
  SELECT id INTO v_city_id FROM locations_cities WHERE name = 'Port Harcourt';

  IF v_city_id IS NOT NULL THEN
    SELECT id INTO v_zone_a_id FROM location_zones WHERE city_id = v_city_id AND name = 'Zone A';
    SELECT id INTO v_zone_b_id FROM location_zones WHERE city_id = v_city_id AND name = 'Zone B';
    SELECT id INTO v_zone_c_id FROM location_zones WHERE city_id = v_city_id AND name = 'Zone C';

    INSERT INTO locations_areas (city_id, zone_id, name, active) VALUES
      (v_city_id, v_zone_a_id, 'D-Line', true),
      (v_city_id, v_zone_a_id, 'Rumuola', true),
      (v_city_id, v_zone_a_id, 'GRA Phase 1', true),
      (v_city_id, v_zone_a_id, 'GRA Phase 2', true),
      (v_city_id, v_zone_a_id, 'Old GRA', true),
      (v_city_id, v_zone_a_id, 'Trans Amadi', true),
      (v_city_id, v_zone_a_id, 'Rumukurushi', true),
      (v_city_id, v_zone_b_id, 'Rumuokoro', true),
      (v_city_id, v_zone_b_id, 'Rumueprikom', true),
      (v_city_id, v_zone_b_id, 'Rumuokwuta', true),
      (v_city_id, v_zone_b_id, 'Rukpokwu', true),
      (v_city_id, v_zone_b_id, 'Eliozu', true),
      (v_city_id, v_zone_b_id, 'Alakahia', true),
      (v_city_id, v_zone_b_id, 'Choba', true),
      (v_city_id, v_zone_b_id, 'Ada George', true),
      (v_city_id, v_zone_c_id, 'Rumuokwurusi', true),
      (v_city_id, v_zone_c_id, 'Rumuodomaya', true),
      (v_city_id, v_zone_c_id, 'Rumueme', true),
      (v_city_id, v_zone_c_id, 'Eleme Junction', true),
      (v_city_id, v_zone_c_id, 'Igwuruta', true),
      (v_city_id, v_zone_c_id, 'Ozuoba', true)
    ON CONFLICT (city_id, name) DO NOTHING;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cities_state_id ON locations_cities(state_id);
CREATE INDEX IF NOT EXISTS idx_zones_city_id ON location_zones(city_id);
CREATE INDEX IF NOT EXISTS idx_areas_city_id ON locations_areas(city_id);
CREATE INDEX IF NOT EXISTS idx_areas_zone_id ON locations_areas(zone_id);
CREATE INDEX IF NOT EXISTS idx_areas_active ON locations_areas(active) WHERE active = true;
