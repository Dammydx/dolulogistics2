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
  3. `location_zones` - Pricing zones (Zone A, B, C, D, E) per city
  4. `locations_areas` - Specific areas assigned to zones

  ## Zone Pricing Model (v1.1)
  Zone A = ₦2,500 | Zone B = ₦3,000 | Zone C = ₦3,500 | Zone D = ₦4,000 | Zone E = ₦5,000

  ## Security
  - RLS enabled on all tables
  - Public can READ (for customer dropdowns)
  - Only authenticated users (admin) can INSERT/UPDATE/DELETE
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
-- SEED DATA: Rivers State and Port Harcourt
-- ============================================================

INSERT INTO locations_states (name, code, active)
VALUES ('Rivers', 'NG-RI', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO locations_cities (state_id, name, active)
SELECT id, 'Port Harcourt', true
FROM locations_states
WHERE code = 'NG-RI'
ON CONFLICT (state_id, name) DO NOTHING;

-- ============================================================
-- SEED DATA: 5 Pricing Zones for Port Harcourt
-- Zone A = ₦2,500 | Zone B = ₦3,000 | Zone C = ₦3,500
-- Zone D = ₦4,000 | Zone E = ₦5,000
-- ============================================================

DO $$
DECLARE
  v_city_id uuid;
BEGIN
  SELECT id INTO v_city_id FROM locations_cities WHERE name = 'Port Harcourt';

  IF v_city_id IS NOT NULL THEN
    INSERT INTO location_zones (city_id, name, description, active) VALUES
      (v_city_id, 'Zone A', '₦2,500 — Core areas around Ada George / NTA corridor', true),
      (v_city_id, 'Zone B', '₦3,000 — Rumuola, GRA, DLine, Eliozu & surrounding', true),
      (v_city_id, 'Zone C', '₦3,500 — Eagle Island, Choba, Trans Amadi, Old GRA & surrounding', true),
      (v_city_id, 'Zone D', '₦4,000 — Borikiri, Elelenwo, Eneka', true),
      (v_city_id, 'Zone E', '₦5,000 — Outer areas: Atali, Akpajo, Igwuruta, Airport, Oyigbo', true)
    ON CONFLICT (city_id, name) DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- SEED DATA: Areas assigned to zones
-- ============================================================

DO $$
DECLARE
  v_city_id uuid;
  v_zone_a_id uuid;
  v_zone_b_id uuid;
  v_zone_c_id uuid;
  v_zone_d_id uuid;
  v_zone_e_id uuid;
BEGIN
  SELECT id INTO v_city_id FROM locations_cities WHERE name = 'Port Harcourt';

  IF v_city_id IS NOT NULL THEN
    SELECT id INTO v_zone_a_id FROM location_zones WHERE city_id = v_city_id AND name = 'Zone A';
    SELECT id INTO v_zone_b_id FROM location_zones WHERE city_id = v_city_id AND name = 'Zone B';
    SELECT id INTO v_zone_c_id FROM location_zones WHERE city_id = v_city_id AND name = 'Zone C';
    SELECT id INTO v_zone_d_id FROM location_zones WHERE city_id = v_city_id AND name = 'Zone D';
    SELECT id INTO v_zone_e_id FROM location_zones WHERE city_id = v_city_id AND name = 'Zone E';

    -- ======== ZONE A — ₦2,500 ========
    INSERT INTO locations_areas (city_id, zone_id, name, active) VALUES
      (v_city_id, v_zone_a_id, 'NTA', true),
      (v_city_id, v_zone_a_id, 'Ada George', true),
      (v_city_id, v_zone_a_id, 'Ozuoba', true),
      (v_city_id, v_zone_a_id, 'Mgbuogba', true),
      (v_city_id, v_zone_a_id, 'Rumuokwuta', true),
      (v_city_id, v_zone_a_id, 'Rumuigbo', true),
      (v_city_id, v_zone_a_id, 'Mile 4', true),
      (v_city_id, v_zone_a_id, 'Agip', true),
      (v_city_id, v_zone_a_id, 'Mile 3', true),
      (v_city_id, v_zone_a_id, 'UST', true),
      (v_city_id, v_zone_a_id, 'Iwofe', true),
      (v_city_id, v_zone_a_id, 'Ogbogoro', true),
      (v_city_id, v_zone_a_id, 'New Road', true),
      (v_city_id, v_zone_a_id, 'Egbelu', true),
      (v_city_id, v_zone_a_id, 'Rumuokoro', true),
      (v_city_id, v_zone_a_id, 'Obirikwere', true)
    ON CONFLICT (city_id, name) DO NOTHING;

    -- ======== ZONE B — ₦3,000 ========
    INSERT INTO locations_areas (city_id, zone_id, name, active) VALUES
      (v_city_id, v_zone_b_id, 'Rumuola', true),
      (v_city_id, v_zone_b_id, 'Mile 2', true),
      (v_city_id, v_zone_b_id, 'Mile 1', true),
      (v_city_id, v_zone_b_id, 'GRA', true),
      (v_city_id, v_zone_b_id, 'Olu Obasanjo', true),
      (v_city_id, v_zone_b_id, 'Sani Abacha', true),
      (v_city_id, v_zone_b_id, 'Waterlines', true),
      (v_city_id, v_zone_b_id, 'Air Force', true),
      (v_city_id, v_zone_b_id, 'Artillery', true),
      (v_city_id, v_zone_b_id, 'Garrison', true),
      (v_city_id, v_zone_b_id, 'Orazi', true),
      (v_city_id, v_zone_b_id, 'Nkpogu', true),
      (v_city_id, v_zone_b_id, 'Stadium Road', true),
      (v_city_id, v_zone_b_id, 'Elekahia', true),
      (v_city_id, v_zone_b_id, 'Rumukalagbor', true),
      (v_city_id, v_zone_b_id, 'UST Backgate', true),
      (v_city_id, v_zone_b_id, 'DLine', true),
      (v_city_id, v_zone_b_id, 'Rumuomasi', true),
      (v_city_id, v_zone_b_id, 'Rumudara', true),
      (v_city_id, v_zone_b_id, 'Rumuibekwe', true),
      (v_city_id, v_zone_b_id, 'Eliozu', true),
      (v_city_id, v_zone_b_id, 'Sars Road', true),
      (v_city_id, v_zone_b_id, 'Rumuodumaya', true),
      (v_city_id, v_zone_b_id, 'Rumuagholu', true),
      (v_city_id, v_zone_b_id, 'Rukpakulusi', true),
      (v_city_id, v_zone_b_id, 'Alakahia', true),
      (v_city_id, v_zone_b_id, 'Rumuekini', true)
    ON CONFLICT (city_id, name) DO NOTHING;

    -- ======== ZONE C — ₦3,500 ========
    INSERT INTO locations_areas (city_id, zone_id, name, active) VALUES
      (v_city_id, v_zone_c_id, 'Eagle Island', true),
      (v_city_id, v_zone_c_id, 'Choba', true),
      (v_city_id, v_zone_c_id, 'Aluu', true),
      (v_city_id, v_zone_c_id, 'Peter Odili', true),
      (v_city_id, v_zone_c_id, 'Old GRA', true),
      (v_city_id, v_zone_c_id, 'Woji', true),
      (v_city_id, v_zone_c_id, 'Eastern By Pass', true),
      (v_city_id, v_zone_c_id, 'Ogbunabali', true),
      (v_city_id, v_zone_c_id, 'Trans Amadi', true),
      (v_city_id, v_zone_c_id, 'Abuloma', true),
      (v_city_id, v_zone_c_id, 'Marine Base', true),
      (v_city_id, v_zone_c_id, 'Creek Road', true),
      (v_city_id, v_zone_c_id, 'Town', true),
      (v_city_id, v_zone_c_id, 'Rumukrushni', true)
    ON CONFLICT (city_id, name) DO NOTHING;

    -- ======== ZONE D — ₦4,000 ========
    INSERT INTO locations_areas (city_id, zone_id, name, active) VALUES
      (v_city_id, v_zone_d_id, 'Borikiri', true),
      (v_city_id, v_zone_d_id, 'Elelenwo', true),
      (v_city_id, v_zone_d_id, 'Eneka', true)
    ON CONFLICT (city_id, name) DO NOTHING;

    -- ======== ZONE E — ₦5,000 ========
    INSERT INTO locations_areas (city_id, zone_id, name, active) VALUES
      (v_city_id, v_zone_e_id, 'Atali', true),
      (v_city_id, v_zone_e_id, 'Akpajo', true),
      (v_city_id, v_zone_e_id, 'Eleme Junction', true),
      (v_city_id, v_zone_e_id, 'Igwuruta', true),
      (v_city_id, v_zone_e_id, 'Airport', true),
      (v_city_id, v_zone_e_id, 'Oyigbo', true),
      (v_city_id, v_zone_e_id, 'Igbo-Etche', true)
    ON CONFLICT (city_id, name) DO NOTHING;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cities_state_id ON locations_cities(state_id);
CREATE INDEX IF NOT EXISTS idx_zones_city_id ON location_zones(city_id);
CREATE INDEX IF NOT EXISTS idx_areas_city_id ON locations_areas(city_id);
CREATE INDEX IF NOT EXISTS idx_areas_zone_id ON locations_areas(zone_id);
CREATE INDEX IF NOT EXISTS idx_areas_active ON locations_areas(active) WHERE active = true;
