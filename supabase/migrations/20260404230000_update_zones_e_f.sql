-- Migration to support Zone F and reassign Port Harcourt areas
-- Zone E: ₦5,000 (Airport, Eleme Junction, Igwuruta)
-- Zone F: ₦6,000 (Akpajo, Atali, Igbo-Etche, Oyigbo)

DO $$
DECLARE
    v_city_id uuid;
    v_zone_e_id uuid;
    v_zone_f_id uuid;
BEGIN
    -- 1. Get City ID
    SELECT id INTO v_city_id FROM locations_cities WHERE name = 'Port Harcourt' LIMIT 1;
    
    IF v_city_id IS NOT NULL THEN
        -- 2. Get Zone E ID
        SELECT id INTO v_zone_e_id FROM location_zones WHERE city_id = v_city_id AND name = 'Zone E';

        -- 3. Create Zone F (Trigger 010 will auto-create matrix rows)
        INSERT INTO location_zones (city_id, name, description, active)
        VALUES (v_city_id, 'Zone F', '₦6,000 — Outer areas: Akpajo, Atali, Igbo-Etche, Oyigbo', true)
        ON CONFLICT (city_id, name) DO UPDATE 
        SET description = EXCLUDED.description
        RETURNING id INTO v_zone_f_id;

        -- 4. Update Zone E description
        UPDATE location_zones 
        SET description = '₦5,000 — Outer areas: Airport, Eleme Junction, Igwuruta'
        WHERE id = v_zone_e_id;

        -- 5. Reassign areas to Zone F
        UPDATE locations_areas
        SET zone_id = v_zone_f_id
        WHERE city_id = v_city_id 
        AND name IN ('Akpajo', 'Atali', 'Igbo-Etche', 'Oyigbo');

        -- 6. Ensure Zone E areas stay in Zone E
        UPDATE locations_areas
        SET zone_id = v_zone_e_id
        WHERE city_id = v_city_id 
        AND name IN ('Airport', 'Eleme Junction', 'Igwuruta');

        -- 7. Update Pricing Rates Matrix
        -- Update all rates where Zone E is the destination
        UPDATE pricing_zone_rates
        SET base_price = 5000, 
            eta_text = '90-120 minutes'
        WHERE to_zone_id = v_zone_e_id;

        -- Update all rates where Zone F is the destination
        UPDATE pricing_zone_rates
        SET base_price = 6000, 
            eta_text = '90-120 minutes'
        WHERE to_zone_id = v_zone_f_id;

    END IF;
END $$;
