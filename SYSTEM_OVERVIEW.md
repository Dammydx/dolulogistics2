# DOLU LOGISTICS - COMPLETE SYSTEM REBUILD

**Date:** February 2026
**Status:** Phase 1 Complete (Customer Pages + Database)
**Phase 2:** Admin Panel (To Be Built)

---

## 🎯 WHAT WAS DONE

This document describes the complete rebuild of the Dolu Logistics system per the specifications provided.

### ✅ COMPLETED (Phase 1)

1. **Complete Database Schema** - All 8 migrations applied to Supabase
2. **TypeScript Types** - Full type definitions for new database
3. **Utility Functions** - Locations, pricing, bookings helpers
4. **Customer Pages** - All 4 pages rebuilt/created:
   - ✅ Get Quote (NEW)
   - ✅ Request Pickup (REBUILT - no email, full address dropdowns, price preview)
   - ✅ Track Parcel (UPDATED - timeline view, new booking schema)
   - ✅ Contact (UPDATED - saves to contact_messages table, new fields)

### ⏳ PENDING (Phase 2)

**Admin Panel** - Complete replacement needed (6 pages):
- Dashboard (overview + stats cards)
- Bookings (dispatch desk with tabs, "Send Tracking SMS" button)
- Contact Messages (inbox with status tabs)
- Pricing & Locations (zone management, rate editor)
- Templates (SMS/email template editor)
- Settings (customer care info, SMS config, admin emails)

---

## 📊 DATABASE SCHEMA OVERVIEW

### Tables Created

All tables have RLS enabled with appropriate policies.

#### **1. Locations Tables**
- `locations_states` - Nigerian states
- `locations_cities` - Cities within states
- `location_zones` - Pricing zones (Zone A, B, C)
- `locations_areas` - Specific areas assigned to zones

**Purpose:** Power the State → City → Area dropdowns in Get Quote and Request Pickup.

**Sample Data:** Rivers State with Port Harcourt city and 20+ areas pre-seeded.

#### **2. Pricing Tables**
- `pricing_zone_rates` - Base prices between zones (e.g., Zone A → Zone B = ₦1200)
- `pricing_addons` - Additional fees (Fragile ₦300, Express ₦500)

**Pricing Logic:**
```
1. Customer selects pickup area + dropoff area
2. System looks up: area → zone_id
3. System finds: pricing_zone_rates WHERE from_zone + to_zone
4. base_price + addon fees = total_price
5. Price saved as snapshot in booking
```

#### **3. Item Categories**
- `item_categories` - Standardized categories:
  - Documents
  - Food Items
  - Electronics/Gadgets
  - Fashion/Clothing
  - Cosmetics
  - Gifts/Packages
  - Household Items
  - Other (requires notes)

**Replaces:** Old "Document/Small/Medium/Large" system

#### **4. Bookings & History**
- `bookings` - Main booking records (replaces old `parcels` table)
- `booking_status_history` - Timeline of status changes

**Key Changes:**
- ❌ NO customer email field (per requirements)
- ✅ Tracking ID format: **DL** + YYYYMMDD + 001 (e.g., DL20240209001)
- ✅ Full address dropdowns (state, city, area)
- ✅ WhatsApp fields (optional) with "same as phone" checkbox
- ✅ Price snapshot (base + addons + total)
- ✅ Rider fields (simple text, no rider table)
- ✅ Status: pending → confirmed → in_progress → delivered

**Auto-Generated History:**
When booking created, system automatically inserts:
```sql
INSERT INTO booking_status_history (booking_id, status, note, created_by)
VALUES (new_booking_id, 'pending', 'Booking received. Customer care will call you shortly.', 'system');
```

#### **5. Contact Messages**
- `contact_messages` - Customer inquiries from Contact page

**Fields:** name, email, phone, whatsapp, subject, message, status, admin_notes

**Status Flow:** new → in_progress → resolved → spam

**Admin Inbox:** Shows in admin Contact Messages page (to be built)

#### **6. Settings & Templates**
- `settings_app` - Key-value store for global settings
- `message_templates` - SMS/WhatsApp/Email templates with placeholders

**Settings Include:**
- Customer care phone/WhatsApp
- Business hours
- Admin email list
- SMS configuration (provider, API key, send mode)
- Email notification toggles

**SMS Send Modes:**
- `manual_only` (DEFAULT) - Admin clicks "Send Tracking SMS" button
- `auto_on_in_progress` - Auto-send when status changes to in_progress

**Why Manual by Default:** Prevents accidental SMS costs.

#### **7. Message Logs**
- `message_logs` - Audit trail for all SMS/email/WhatsApp sent

**Purpose:** Cost tracking, debugging, compliance

---

## 🎨 CUSTOMER PAGES (COMPLETED)

### **1. Get Quote Page** (`/get-quote`) ✅

**Purpose:** Let customers get instant price estimates without booking.

**Features:**
- State → City → Area dropdowns for pickup
- State → City → Area dropdowns for dropoff
- Optional add-ons (Fragile, Express) with checkboxes
- Real-time price calculation (auto-updates when locations change)
- ETA display (if available from zone rates)
- "Continue to Request Pickup" button → prefills Request Pickup form

**Price Calculation:**
```typescript
// See: src/utils/pricing.ts
1. Get zone_id from pickup_area_id
2. Get zone_id from dropoff_area_id
3. Lookup pricing_zone_rates WHERE from_zone + to_zone
4. Sum selected addon fees
5. Return: base_price + addons_price = total_price
```

**Mobile-First:** Fully responsive, stacked layout on mobile.

---

### **2. Request Pickup Page** (`/request-pickup`) ✅ REBUILT

**Purpose:** Complete booking form for customers.

**Form Structure:**

1. **Sender Information**
   - Full name (required)
   - Phone (required)
   - WhatsApp (optional) + "same as phone" checkbox

2. **Pickup Location**
   - State dropdown (required)
   - City dropdown (required)
   - Area dropdown (required)
   - Street address (required)
   - Landmark (optional)

3. **Receiver Information**
   - Full name (required)
   - Phone (required)
   - WhatsApp (optional) + "same as phone" checkbox

4. **Dropoff Location**
   - Same structure as pickup

5. **Item Details**
   - Category dropdown (from `item_categories`)
   - Additional notes (optional)

6. **Optional Add-ons**
   - Fragile Handling (+₦300)
   - Express Delivery (+₦500)

7. **Price Preview** (Sticky Sidebar)
   - Base price
   - Add-ons price
   - Total price
   - ETA text
   - Auto-calculates when locations selected

**On Submit:**
```typescript
// See: src/utils/bookings.ts → createBooking()
1. Validate all fields
2. Call generate_tracking_id() database function
3. Insert into bookings table
4. Insert initial history entry (system-generated)
5. Return tracking_id
6. Show success screen with tracking ID
```

**Success Screen:**
- Displays tracking ID prominently (e.g., DL20240209001)
- "Track My Parcel" button
- "Back to Home" button

**Prefill Support:**
If user comes from Get Quote, locations and add-ons are prefilled.

**NO EMAIL FIELD:** Per requirements, customer email is NOT collected.

---

### **3. Track Parcel Page** (`/track`) ✅ UPDATED

**Purpose:** Let customers track parcels using tracking ID.

**Features:**
- Search input accepts tracking ID
- Auto-search if ID in URL (`/track?id=DL20240209001`)
- Displays:
  - Current status badge
  - Pickup → Dropoff route info
  - Sender/Receiver contact info
  - Total price
  - Booking date
  - **Status Timeline** (from `booking_status_history`)

**Timeline Display:**
```
✅ Delivered                    Feb 10, 2026 3:45 PM
   "Package delivered successfully"

○ Out for Delivery              Feb 10, 2026 1:20 PM
   "Rider is on the way"

○ In Progress                   Feb 10, 2026 9:00 AM
   "Parcel picked up and in transit"

○ Confirmed                     Feb 9, 2026 5:30 PM
   "Booking confirmed. Rider assigned: John Doe"

○ Pending                       Feb 9, 2026 2:15 PM
   "Booking received. Customer care will call you shortly."
```

**Customer Care Buttons:**
- Call Us (tel: link)
- WhatsApp (wa.me link)

---

### **4. Contact Page** (`/contact`) ✅ UPDATED

**Purpose:** Customer inquiries.

**Form Fields:**
- Name (required)
- Email (optional)
- Phone (optional)
- WhatsApp (optional)
- Subject (optional)
- Message (required)

**On Submit:**
```typescript
// Saves to contact_messages table
INSERT INTO contact_messages (name, email, phone, whatsapp, subject, message, status)
VALUES (..., 'new');
```

**Admin Visibility:**
Messages appear in admin "Contact Messages" inbox (to be built).

**Optional Email Forwarding:**
If `settings.email_on_new_contact_message = true`, system sends email to admin list.

---

## 🔧 UTILITY FUNCTIONS

All heavily commented. See code for detailed logic.

### **src/utils/locations.ts**
- `fetchStates()` - Get all active states
- `fetchCitiesByState()` - Get cities for a state
- `fetchAreasByCity()` - Get areas for a city
- `fetchZoneForArea()` - Get pricing zone for an area
- Dropdown conversion helpers

### **src/utils/pricing.ts**
- `calculatePriceQuote()` - **MAIN PRICING FUNCTION**
  - Heavily commented
  - Explains: area → zone → rate lookup → addon sum → total
- `fetchAddons()` - Get active add-ons
- `formatPrice()` - Format as ₦1,200.00
- `validateRoute()` - Ensure valid route

### **src/utils/bookings.ts**
- `generateTrackingId()` - Calls database function for unique DL ID
- `createBooking()` - **MAIN BOOKING CREATION**
  - Heavily commented
  - Explains: tracking ID generation → booking insert → history insert
- `fetchBookingByTrackingId()` - For Track page
- `fetchBookingHistory()` - Get timeline
- `fetchItemCategories()` - Get categories
- Status helpers (label, color)

---

## 🎨 DESIGN & RESPONSIVENESS

**Mobile-First:** All pages designed mobile-first, then enhanced for desktop.

**Responsive Patterns:**
- Forms: Single column on mobile, multi-column on desktop
- Get Quote: Stacked on mobile, sidebar on desktop
- Request Pickup: Stacked on mobile, sticky sidebar on desktop
- Track: Cards stack on mobile

**Color Scheme:**
- Primary Blue: `#1558B0` (Dolu brand color from logo)
- Accent Lemon: `#A6E22E` (Dolu brand color)
- Success Green: `#16A34A`
- Light Background: `#F7FAFF`

**Accessibility:**
- Proper labels, ARIA attributes
- Focus states on all inputs
- Clear error messages
- Readable contrast ratios

---

## 🚨 WHAT STILL NEEDS TO BE BUILT

### **ADMIN PANEL (Complete Replacement)**

The old admin panel has been removed. A completely new admin system is needed with these pages:

#### **1. Admin Login** (`/admin`) ✅ KEPT
- Password: `Mailpassword1`
- Stores auth in sessionStorage
- Redirects to dashboard on success

#### **2. Admin Layout** (NEW - Mobile Responsive)
- Fixed sidebar (desktop)
- Hamburger drawer (mobile)
- Sidebar items:
  - Dashboard
  - Bookings
  - Contact Messages
  - Pricing & Locations
  - Templates
  - Settings
  - Logout

#### **3. Dashboard** (`/admin/dashboard`) (NEW)
**Features:**
- Stats cards:
  - Pending bookings count
  - Confirmed count
  - Not Accepted count
  - In Progress count
  - Delivered count
  - Cancelled count
- Recent bookings list (latest 10)

#### **4. Bookings** (`/admin/dashboard/bookings`) (NEW - Dispatch Desk)
**Features:**
- **Tabs/Filters:**
  - Pending
  - Confirmed
  - Not Accepted
  - In Progress
  - Delivered
  - Cancelled
  - All

- **Booking List** (Desktop: Table, Mobile: Cards)
  - Columns: Tracking ID, Sender Phone, Route (pickup → dropoff), Total Price, Status, Created

- **Booking Details View** (Click to open)
  - Sender info + Call/WhatsApp buttons
  - Receiver info + Call/WhatsApp buttons
  - Pickup address + Copy button
  - Dropoff address + Copy button
  - Item category + notes
  - Price snapshot (base + addons + total)
  - **Rider Assignment:**
    - rider_name (text input)
    - rider_phone (text input)
  - **Status Timeline** (from booking_status_history)
  - Admin notes (optional textarea)

- **Admin Actions:**
  - Confirm Booking → status = confirmed
  - Mark Not Accepted → status = not_accepted (requires reason)
  - Move to In Progress → status = in_progress
  - Mark Delivered → status = delivered
  - Cancel → status = cancelled
  - **"Send Tracking SMS" button** (if SMS enabled)

**CRITICAL: Status Update Logic**
```typescript
// Every status change MUST:
1. Update bookings.status
2. Insert into booking_status_history with:
   - status
   - note (auto-generated or admin-entered)
   - created_by = 'admin'
   - created_at = now()
```

**SMS Button:**
- Only shows if `settings.sms_enabled = true`
- Onclick:
  1. Get template from message_templates WHERE code = 'sms_tracking'
  2. Replace placeholders: {tracking_id}, {sender_name}, etc.
  3. Call SMS provider API
  4. Insert log into message_logs
  5. Insert history entry: "Tracking SMS sent to sender."

#### **5. Contact Messages** (`/admin/dashboard/messages`) (NEW)
**Features:**
- **Tabs:**
  - New
  - In Progress
  - Resolved
  - Spam
  - All

- **Message List**
  - Desktop: Table
  - Mobile: Cards
  - Shows: Name, Email, Phone, Subject, Message snippet, Status, Date

- **Message Detail View**
  - Full message
  - All contact info (name, email, phone, whatsapp)
  - Call/WhatsApp buttons
  - **Status Update Buttons:**
    - Mark as In Progress
    - Mark as Resolved
    - Mark as Spam
  - Admin notes textarea

#### **6. Pricing & Locations** (`/admin/dashboard/pricing`) (NEW)
**Features:**

**Tab 1: Manage Locations**
- Add/Edit States
- Add/Edit Cities (select state)
- Add/Edit Areas (select city, assign zone)

**Tab 2: Manage Zones**
- Add/Edit Zones per city (Zone A, B, C, etc.)
- Assign areas to zones

**Tab 3: Zone Rates**
- Table: From Zone | To Zone | Base Price | ETA | Active
- Add/Edit rate
- Delete rate

**Tab 4: Add-ons**
- Table: Name | Code | Description | Fee | Active
- Add/Edit addon (Fragile, Express, etc.)
- Delete addon

**IMPORTANT:** All pricing changes affect future bookings only (past bookings use saved snapshot).

#### **7. Templates** (`/admin/dashboard/templates`) (NEW)
**Features:**
- List of templates:
  - SMS Tracking
  - WhatsApp Tracking
  - Email: New Booking (to admin)
  - Email: Contact Message (to admin)

- **Template Editor:**
  - Name
  - Type (SMS/WhatsApp/Email)
  - Subject (for emails)
  - Body (textarea with placeholder helper)
  - Available Placeholders list:
    - {tracking_id}
    - {sender_name}
    - {receiver_name}
    - {status}
    - {pickup_area}
    - {dropoff_area}
    - {rider_name}
    - {customer_care_phone}

#### **8. Settings** (`/admin/dashboard/settings`) (NEW)
**Features:**

**Section 1: Customer Care Info**
- Customer Care Phone
- Customer Care WhatsApp
- Business Hours (textarea)

**Section 2: Admin Notifications**
- Admin Emails (array input)
- Toggle: Email on new booking
- Toggle: Email on new contact message

**Section 3: SMS Configuration**
- Toggle: SMS Enabled
- SMS Send Mode:
  - manual_only (default)
  - auto_on_in_progress
- SMS Provider (dropdown: Termii, Twilio, etc.)
- SMS API Key (password input)
- SMS Sender Name (e.g., "DoluLog")

**SMS Test Button:** Send test SMS to verify configuration

---

##  📚 HOW PRICING WORKS (DETAILED)

This is the core logic of the system. All code is heavily commented.

### **Step-by-Step Pricing Flow**

**1. Customer Experience (Get Quote or Request Pickup):**
```
User selects:
- Pickup Area: "Rumuola" (Zone A)
- Dropoff Area: "Eliozu" (Zone B)
- Add-ons: [Fragile]
```

**2. Frontend Calculation:**
```typescript
// src/utils/pricing.ts → calculatePriceQuote()

// Step 1: Get zone for pickup area
const pickupZone = await fetchZoneForArea("area-id-rumuola");
// Result: zone_id = "zone-a-id"

// Step 2: Get zone for dropoff area
const dropoffZone = await fetchZoneForArea("area-id-eliozu");
// Result: zone_id = "zone-b-id"

// Step 3: Lookup zone rate
const rate = await supabase
  .from('pricing_zone_rates')
  .select('base_price, eta_text')
  .eq('from_zone_id', 'zone-a-id')
  .eq('to_zone_id', 'zone-b-id')
  .eq('active', true)
  .single();
// Result: base_price = 1200, eta_text = "45-60 minutes"

// Step 4: Calculate add-ons
const fragileAddon = await supabase
  .from('pricing_addons')
  .select('fee')
  .eq('code', 'FRAGILE')
  .single();
// Result: fee = 300

// Step 5: Calculate total
const total = 1200 + 300 = 1500

// Return quote
return {
  success: true,
  base_price: 1200,
  addons_price: 300,
  total_price: 1500,
  eta_text: "45-60 minutes"
};
```

**3. Price Display:**
```
Base Price:     ₦1,200.00
Add-ons:        ₦300.00
--------------------------
Total:          ₦1,500.00

Est. Delivery: 45-60 minutes
```

**4. Booking Creation (Price Snapshot):**
```typescript
// When booking is created:
INSERT INTO bookings (
  ...,
  price_base,      // 1200
  price_addons,    // 300
  price_total,     // 1500
  addons_selected  // ['FRAGILE']
)
```

**5. Why Snapshot?**
- Prices may change over time (admin updates rates)
- Historical bookings must show original price customer was charged
- Snapshot ensures accuracy for accounting/refunds

### **Admin Price Management**

**To change pricing:**
1. Go to Admin → Pricing & Locations
2. Navigate to "Zone Rates" tab
3. Find: Zone A → Zone B
4. Update base_price from ₦1,200 to ₦1,500
5. Save

**Effect:**
- ✅ NEW bookings: Use ₦1,500
- ❌ OLD bookings: Still show ₦1,200 (snapshot preserved)

---

## 🔐 SECURITY & RLS

**Row Level Security (RLS) is enabled on ALL tables.**

### **Locations, Pricing, Categories:**
- Public can SELECT (read) - needed for dropdowns/quotes
- Only authenticated users (admin) can INSERT/UPDATE/DELETE

### **Bookings:**
- Public can INSERT (create bookings)
- Public can SELECT (needed for tracking)
- Only authenticated users (admin) can UPDATE/DELETE

### **Booking History:**
- Public can SELECT (needed for tracking timeline)
- Public can INSERT only if created_by = 'system'
- Only authenticated users (admin) can manage all

### **Contact Messages:**
- Public can INSERT (submit form)
- Only authenticated users (admin) can SELECT/UPDATE/DELETE

### **Settings, Templates, Logs:**
- Only authenticated users (admin) can access

**Admin Authentication:**
- Simple password check (no Supabase auth used)
- Session stored in `sessionStorage`
- Password: `Mailpassword1`

---

## 🚀 DEPLOYMENT NOTES

### **Environment Variables Required**

```.env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Database Setup**

All migrations have been applied via `mcp__supabase__apply_migration` tool:
1. ✅ 001_create_locations_tables
2. ✅ 002_create_pricing_tables
3. ✅ 003_create_item_categories
4. ✅ 004_create_bookings_tables
5. ✅ 005_create_contact_messages_table
6. ✅ 006_create_settings_and_templates
7. ✅ 007_create_message_logs
8. ✅ 008_additional_indexes_constraints

**Sample Data Included:**
- Rivers State
- Port Harcourt city
- 3 zones (A, B, C)
- 20+ areas
- Zone rates for all combinations
- 2 add-ons (Fragile, Express)
- 8 item categories
- Default settings
- Default templates

### **Build & Deploy**

```bash
npm install
npm run build
# Deploy dist/ folder to your hosting (Vercel, Netlify, etc.)
```

### **GitHub Pages Deployment**

If deploying to GitHub Pages:
1. Uncomment `homepage` in `package.json`
2. Uncomment `base` in `vite.config.ts`
3. Update with your repo name

---

## 📝 CODE ORGANIZATION

```
src/
├── types/
│   └── database.ts          # All TypeScript types (HEAVILY COMMENTED)
├── utils/
│   ├── locations.ts         # Location helpers (COMMENTED)
│   ├── pricing.ts           # Pricing logic (HEAVILY COMMENTED)
│   └── bookings.ts          # Booking helpers (HEAVILY COMMENTED)
├── pages/
│   ├── quote/
│   │   └── GetQuotePage.tsx          # NEW
│   ├── request/
│   │   └── NewRequestPickupPage.tsx  # REBUILT
│   ├── track/
│   │   └── NewTrackPage.tsx          # UPDATED
│   ├── contact/
│   │   └── ContactPage.tsx           # UPDATED
│   ├── home/
│   ├── services/
│   ├── about/
│   └── admin/
│       ├── AdminLogin.tsx   # KEPT
│       └── [ADMIN PAGES TO BE BUILT]
├── components/
│   └── layout/
│       ├── Navbar.tsx       # UPDATED (added Get Quote link)
│       └── Footer.tsx
└── lib/
    └── supabase.ts
```

---

## ⚠️ CRITICAL NOTES

### **1. NO CUSTOMER EMAIL**
- Bookings do NOT collect customer email (per requirements)
- Contact form DOES collect email (optional)
- SMS/WhatsApp are primary communication channels

### **2. TRACKING ID FORMAT**
- Must start with "DL" (Dolu Logistics)
- Format: DL + YYYYMMDD + sequential number
- Example: DL20240209001
- Generated by database function `generate_tracking_id()`
- Automatically ensures uniqueness

### **3. SMS COST CONTROL**
- SMS is DISABLED by default (`sms_enabled = false`)
- When enabled, mode is `manual_only` by default
- Admin must EXPLICITLY click "Send Tracking SMS" button
- Auto mode only triggers on status = 'in_progress'
- **Why:** Prevents accidental SMS costs

### **4. PRICE SNAPSHOT**
- Every booking saves a price snapshot
- base_price + addons_price + total_price
- Even if admin changes pricing later, old bookings show original price
- **Critical for accounting accuracy**

### **5. STATUS HISTORY**
- EVERY status change MUST create a history entry
- Used by Track Parcel page timeline
- Used by admin for audit trail
- Never delete history entries

### **6. MOBILE-FIRST**
- All pages designed mobile-first
- Admin panel MUST be mobile responsive
- Tables become cards on mobile
- Sidebar becomes drawer on mobile

---

## 📞 NEXT STEPS

### **Phase 2: Build Admin Panel**

**Recommended Order:**
1. **Admin Layout** - Create responsive sidebar/drawer
2. **Dashboard** - Stats cards + recent bookings
3. **Bookings** - Dispatch desk (most complex, highest priority)
4. **Contact Messages** - Admin inbox
5. **Pricing & Locations** - Zone/rate management
6. **Templates** - SMS/email editor
7. **Settings** - Configuration page

**Estimated Complexity:**
- Bookings page: HIGH (dispatch desk, status updates, SMS button)
- Pricing page: HIGH (CRUD for zones/rates)
- Others: MEDIUM

**Testing Checklist:**
- [ ] Create booking from Request Pickup
- [ ] Track booking shows timeline
- [ ] Admin can view booking in dispatch desk
- [ ] Admin can update status
- [ ] Status update creates history entry
- [ ] Price calculator works correctly
- [ ] Contact messages appear in admin inbox
- [ ] SMS button (if enabled) works

---

## 🐛 KNOWN ISSUES / TODO

1. **Admin Panel** - Needs to be built (Phase 2)
2. **Email Sending** - Backend/edge function needed for admin notifications
3. **SMS Integration** - Backend/edge function needed for SMS sending
4. **Old Files** - Can delete:
   - `src/pages/track/TrackPage.tsx` (replaced by NewTrackPage.tsx)
   - `src/pages/request/RequestPickupPage.tsx` (replaced by NewRequestPickupPage.tsx)
   - `src/pages/admin/AdminDashboard.tsx` (old version)
   - `src/pages/admin/AdminMessages.tsx` (old version)
   - `src/pages/admin/AdminRequests.tsx` (old version)
   - `src/types/supabase.ts` (replaced by database.ts)

---

## 📚 FURTHER READING

- **Database Schema:** See migration files for detailed SQL
- **Pricing Logic:** See `src/utils/pricing.ts` (heavily commented)
- **Booking Creation:** See `src/utils/bookings.ts` (heavily commented)
- **Type Definitions:** See `src/types/database.ts` (comprehensive comments)

---

**Built with:** React + TypeScript + Vite + Tailwind CSS + Supabase + Framer Motion
**Author:** DevWave (DammyTechHub)
**Client:** Dolu Logistics

---
