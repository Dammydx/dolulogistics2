-- 011_create_rider_portal.sql
-- DOLU LOGISTICS - RIDER PORTAL MIGRATION (v1.2)
-- Implementation of Riders table and Booking assignment logic.

-- 1. Create the 'riders' table
CREATE TABLE IF NOT EXISTS public.riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  pin_code TEXT NOT NULL, -- Hashed/Stored PIN
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add 'assigned_rider_id' to the bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS assigned_rider_id UUID REFERENCES public.riders(id) ON DELETE SET NULL;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

-- 4. Create a policy for Admin/App access
-- This logic assumes the API handles auth via service role/app logic.
CREATE POLICY "Allow all access to riders" ON public.riders
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_riders_updated_at ON public.riders;
CREATE TRIGGER set_riders_updated_at
  BEFORE UPDATE ON public.riders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Documentation:
-- Status 'archived' is used to keep historical records of riders who are no longer active.
-- 'assigned_rider_id' links new bookings to the rider entity for advanced tracking and payouts.
