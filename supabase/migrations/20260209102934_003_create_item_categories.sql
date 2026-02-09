/*
  # Create Item Categories Table

  ## Purpose
  Stores the list of item categories customers can select during booking.
  Replaces the old "Document/Small/Medium/Large" system.

  ## Table Created
  - `item_categories` - List of standardized categories

  ## Categories
  1. Documents
  2. Food Items
  3. Electronics/Gadgets
  4. Fashion/Clothing
  5. Cosmetics
  6. Gifts/Packages
  7. Household Items
  8. Other (requires notes)

  ## Security
  - RLS enabled
  - Public can READ (for booking form dropdown)
  - Only authenticated users (admin) can INSERT/UPDATE/DELETE

  ## Future Enhancement
  Admin can add category-specific fees if needed
*/

-- ============================================================
-- TABLE: item_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS item_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  requires_notes boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

CREATE POLICY "Public can view active categories"
  ON item_categories FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Authenticated users can manage categories"
  ON item_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SEED DATA: Standard item categories
-- ============================================================

INSERT INTO item_categories (name, code, description, requires_notes, active) VALUES
  ('Documents', 'DOCUMENTS', 'Papers, contracts, certificates, etc.', false, true),
  ('Food Items', 'FOOD', 'Meals, groceries, perishables', false, true),
  ('Electronics/Gadgets', 'ELECTRONICS', 'Phones, laptops, accessories', false, true),
  ('Fashion/Clothing', 'FASHION', 'Clothes, shoes, accessories', false, true),
  ('Cosmetics', 'COSMETICS', 'Beauty products, skincare items', false, true),
  ('Gifts/Packages', 'GIFTS', 'Gift items, wrapped packages', false, true),
  ('Household Items', 'HOUSEHOLD', 'Home goods, kitchen items, etc.', false, true),
  ('Other', 'OTHER', 'Other items (please specify in notes)', true, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- INDEX for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_categories_active ON item_categories(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_categories_code ON item_categories(code);
