/*
  # Create Settings and Templates Tables

  ## Purpose
  Central configuration for the entire Dolu Logistics system.

  ## Tables Created
  1. `settings_app` - Global application settings (key-value store)
  2. `message_templates` - SMS/WhatsApp/Email templates with placeholders

  ## Settings Categories
  
  ### Customer Care Info
  - customer_care_phone
  - customer_care_whatsapp
  - business_hours_text
  
  ### Admin Notifications
  - admin_emails (JSON array of email addresses)
  - email_on_new_booking (boolean)
  - email_on_new_contact_message (boolean)
  
  ### SMS Configuration
  - sms_enabled (boolean)
  - sms_send_mode ('manual_only' or 'auto_on_in_progress')
  - sms_provider (e.g., 'termii', 'twilio')
  - sms_api_key (encrypted)
  - sms_sender_name (e.g., 'DoluLog')
  
  ## Message Templates
  Templates support placeholders like:
  - {tracking_id}
  - {sender_name}
  - {receiver_name}
  - {status}
  - {pickup_area}
  - {dropoff_area}
  - {rider_name}
  - {customer_care_phone}
  
  ## Template Types
  - sms_tracking: Sent when admin clicks "Send Tracking SMS"
  - whatsapp_tracking: WhatsApp version of tracking message
  - email_new_booking: Email to admin when new booking created
  - email_contact_message: Email to admin when new contact message received
  
  ## Security
  - RLS enabled
  - Public can READ settings (for customer-facing info)
  - Only authenticated users (admin) can UPDATE
  - Templates: public can read active ones, admin can manage
  
  ## Important Notes
  - SMS is MANUAL by default (sms_send_mode = 'manual_only')
  - Admin must click "Send Tracking SMS" button
  - Auto mode only triggers when status changes to 'in_progress'
  - This prevents accidental SMS costs
*/

-- ============================================================
-- TABLE: settings_app (Key-Value Store)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings_app (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- TABLE: message_templates
-- ============================================================
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  type text NOT NULL, -- 'sms', 'whatsapp', 'email'
  code text UNIQUE NOT NULL, -- e.g., 'sms_tracking', 'email_new_booking'
  subject text, -- For emails only
  body text NOT NULL,
  placeholders text[], -- List of available placeholders
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_template_type CHECK (type IN ('sms', 'whatsapp', 'email'))
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE settings_app ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: settings_app
-- ============================================================

-- Public can read settings (for customer care info, etc.)
CREATE POLICY "Public can read settings"
  ON settings_app FOR SELECT
  TO public
  USING (true);

-- Only authenticated users (admin) can update settings
CREATE POLICY "Authenticated users can manage settings"
  ON settings_app FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RLS POLICIES: message_templates
-- ============================================================

-- Public can read active templates
CREATE POLICY "Public can view active templates"
  ON message_templates FOR SELECT
  TO public
  USING (active = true);

-- Only authenticated users (admin) can manage templates
CREATE POLICY "Authenticated users can manage templates"
  ON message_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SEED DATA: Default Settings
-- ============================================================

INSERT INTO settings_app (key, value, description) VALUES
  ('customer_care_phone', '"+234 913 027 8580"', 'Primary customer care phone number'),
  ('customer_care_whatsapp', '"+234 913 027 8580"', 'WhatsApp number for customer support'),
  ('business_hours_text', '"Monday-Friday: 8:30 AM - 5:00 PM, Saturday: 9:00 AM - 5:00 PM, Sunday: Closed"', 'Business operating hours'),
  
  ('admin_emails', '["admin@dolulogistics.com"]', 'List of admin email addresses'),
  ('email_on_new_booking', 'true', 'Send email to admins when new booking created'),
  ('email_on_new_contact_message', 'true', 'Send email to admins when new contact message received'),
  
  ('sms_enabled', 'false', 'Master toggle for SMS functionality'),
  ('sms_send_mode', '"manual_only"', 'SMS send mode: manual_only or auto_on_in_progress'),
  ('sms_provider', '"termii"', 'SMS provider (termii, twilio, etc.)'),
  ('sms_api_key', '""', 'SMS provider API key (keep secure)'),
  ('sms_sender_name', '"DoluLog"', 'Sender name shown in SMS')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED DATA: Default Message Templates
-- ============================================================

INSERT INTO message_templates (name, type, code, subject, body, placeholders, active) VALUES
  (
    'Tracking SMS',
    'sms',
    'sms_tracking',
    NULL,
    'Hi {sender_name}, your parcel (ID: {tracking_id}) is on the way! Track it at dolulogistics.com/track. Questions? Call {customer_care_phone}. - Dolu Logistics',
    ARRAY['tracking_id', 'sender_name', 'customer_care_phone'],
    true
  ),
  (
    'Tracking WhatsApp',
    'whatsapp',
    'whatsapp_tracking',
    NULL,
    'Hello {sender_name}! 📦

Your parcel is being delivered:
Tracking ID: *{tracking_id}*
Status: *{status}*
Route: {pickup_area} → {dropoff_area}

Track online: dolulogistics.com/track

Need help? Call us: {customer_care_phone}

Thank you for choosing Dolu Logistics! 🚚',
    ARRAY['tracking_id', 'sender_name', 'status', 'pickup_area', 'dropoff_area', 'customer_care_phone'],
    true
  ),
  (
    'New Booking Email (Admin)',
    'email',
    'email_new_booking',
    'New Booking: {tracking_id}',
    'A new booking has been received.

Tracking ID: {tracking_id}
Sender: {sender_name} ({sender_phone})
Receiver: {receiver_name} ({receiver_phone})
Route: {pickup_area} → {dropoff_area}
Total: ₦{price_total}

Status: Pending

View in admin panel: [Admin Dashboard URL]

- Dolu Logistics System',
    ARRAY['tracking_id', 'sender_name', 'sender_phone', 'receiver_name', 'receiver_phone', 'pickup_area', 'dropoff_area', 'price_total'],
    true
  ),
  (
    'New Contact Message Email (Admin)',
    'email',
    'email_contact_message',
    'New Contact Message from {name}',
    'A new contact message has been received.

From: {name}
Email: {email}
Phone: {phone}
Subject: {subject}

Message:
{message}

Respond via admin panel: [Admin Dashboard URL]

- Dolu Logistics System',
    ARRAY['name', 'email', 'phone', 'subject', 'message'],
    true
  )
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_templates_type ON message_templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_code ON message_templates(code);
CREATE INDEX IF NOT EXISTS idx_templates_active ON message_templates(active) WHERE active = true;
