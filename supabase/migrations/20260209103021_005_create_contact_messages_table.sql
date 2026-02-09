/*
  # Create Contact Messages Table

  ## Purpose
  Stores messages submitted via the Contact page.
  Admin can view and manage these in the new "Contact Messages" inbox.

  ## Table Created
  - `contact_messages` - Customer inquiries from contact form

  ## Flow
  1. Customer fills contact form on website
  2. Message saved to this table
  3. Admin sees it in "Contact Messages" inbox in admin panel
  4. Admin can update status (New → In Progress → Resolved → Spam)
  5. Optional: System can email admin when new message arrives (if enabled in settings)

  ## Status Options
  - new: Just submitted
  - in_progress: Admin is working on it
  - resolved: Issue handled
  - spam: Marked as spam

  ## Security
  - RLS enabled
  - Public can INSERT (submit contact form)
  - Only authenticated users (admin) can SELECT/UPDATE/DELETE

  ## Email Forwarding
  When settings.email_contact_messages_enabled = true:
  - New messages trigger email to admin_emails list
  - Handled by backend/edge function
*/

-- ============================================================
-- TABLE: contact_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sender information
  name text NOT NULL,
  email text,
  phone text,
  whatsapp text,
  
  -- Message content
  subject text,
  message text NOT NULL,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'new',
  
  -- Admin notes (internal use only)
  admin_notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_message_status CHECK (status IN ('new', 'in_progress', 'resolved', 'spam'))
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Public can submit contact messages
CREATE POLICY "Public can submit contact messages"
  ON contact_messages FOR INSERT
  TO public
  WITH CHECK (true);

-- Only authenticated users (admin) can view messages
CREATE POLICY "Authenticated users can view all messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users (admin) can update/delete messages
CREATE POLICY "Authenticated users can manage messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete messages"
  ON contact_messages FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);
