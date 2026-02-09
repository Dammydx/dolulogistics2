/*
  # Create Message Logs Table

  ## Purpose
  Audit trail for all SMS, WhatsApp, and Email messages sent by the system.
  Critical for:
  - Cost tracking (SMS charges)
  - Debugging delivery issues
  - Compliance and record-keeping

  ## Table Created
  - `message_logs` - Complete log of all messages sent

  ## What Gets Logged
  Every time the system sends:
  - SMS (tracking notifications)
  - Email (admin notifications)
  - WhatsApp (future feature)
  
  ## Log Entry Contains
  - Message type (sms, email, whatsapp)
  - Recipient (phone/email)
  - Template used
  - Full message body
  - Booking reference (if applicable)
  - Success/failure status
  - Error message (if failed)
  - Cost (for SMS)
  - Timestamp

  ## Use Cases
  1. Admin clicks "Send Tracking SMS" → log entry created
  2. New booking triggers admin email → log entry created
  3. Auto SMS on status change → log entry created
  4. Track SMS delivery failures
  5. Calculate total SMS costs

  ## Security
  - RLS enabled
  - Only authenticated users (admin) can view logs
  - System can insert logs (for automatic logging)

  ## Important Notes
  - Logs are append-only (no updates/deletes by design)
  - Failed messages are logged with error details
  - Cost tracking helps monitor SMS expenses
*/

-- ============================================================
-- TABLE: message_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Message type and recipient
  message_type text NOT NULL, -- 'sms', 'email', 'whatsapp'
  recipient text NOT NULL, -- Phone number or email address
  
  -- Related records
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  contact_message_id uuid REFERENCES contact_messages(id) ON DELETE SET NULL,
  
  -- Template used
  template_code text,
  
  -- Message content
  subject text, -- For emails
  body text NOT NULL,
  
  -- Delivery status
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message text,
  
  -- Provider response (for debugging)
  provider_response jsonb,
  
  -- Cost tracking (for SMS)
  cost numeric(10, 4) DEFAULT 0,
  
  -- Who triggered this message
  triggered_by text DEFAULT 'system', -- 'admin', 'system', 'auto'
  
  -- Timestamp
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_message_type CHECK (message_type IN ('sms', 'email', 'whatsapp')),
  CONSTRAINT valid_log_status CHECK (status IN ('pending', 'sent', 'failed'))
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Only authenticated users (admin) can view logs
CREATE POLICY "Authenticated users can view all logs"
  ON message_logs FOR SELECT
  TO authenticated
  USING (true);

-- System can insert logs (for automatic logging)
CREATE POLICY "System can create log entries"
  ON message_logs FOR INSERT
  TO public
  WITH CHECK (true);

-- Admin can insert logs manually (when they click "Send SMS" button)
CREATE POLICY "Authenticated users can create logs"
  ON message_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Logs are immutable (no updates or deletes)
-- This is by design for audit integrity

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_message_logs_type ON message_logs(message_type);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_booking_id ON message_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON message_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_recipient ON message_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_message_logs_triggered_by ON message_logs(triggered_by);
