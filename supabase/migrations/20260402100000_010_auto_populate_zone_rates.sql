-- Trigger to automatically create pricing rate matrix when a new zone is added
CREATE OR REPLACE FUNCTION handle_new_zone_rates()
RETURNS TRIGGER AS $$
DECLARE
    v_zone_id uuid;
    v_existing_price numeric(10,2);
BEGIN
    -- Loop through all currently existing zones (including the newly inserted one)
    FOR v_zone_id IN SELECT id FROM location_zones
    LOOP
        IF v_zone_id = NEW.id THEN
            -- Price from NEW zone to itself defaults to 0
            INSERT INTO pricing_zone_rates(from_zone_id, to_zone_id, base_price, active)
            VALUES (NEW.id, NEW.id, 0, true)
            ON CONFLICT (from_zone_id, to_zone_id) DO NOTHING;
        ELSE
            -- Price from NEW zone to existing zone.
            -- We look up the existing zone's standard base price first.
            SELECT base_price INTO v_existing_price
            FROM pricing_zone_rates
            WHERE to_zone_id = v_zone_id
            LIMIT 1;
            
            IF v_existing_price IS NULL THEN
                v_existing_price := 0;
            END IF;

            INSERT INTO pricing_zone_rates(from_zone_id, to_zone_id, base_price, active)
            VALUES (NEW.id, v_zone_id, v_existing_price, true)
            ON CONFLICT (from_zone_id, to_zone_id) DO NOTHING;
            
            -- Price from existing zone to NEW zone defaults to 0
            INSERT INTO pricing_zone_rates(from_zone_id, to_zone_id, base_price, active)
            VALUES (v_zone_id, NEW.id, 0, true)
            ON CONFLICT (from_zone_id, to_zone_id) DO NOTHING;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_zone_created ON location_zones;
CREATE TRIGGER on_zone_created
    AFTER INSERT ON location_zones
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_zone_rates();
