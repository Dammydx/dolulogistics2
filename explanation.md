# Dolu Logistics - System Explanation & Workflow Guide

Welcome to the internal system overview for Dolu Logistics. This document is designed to guide stakeholders, partners, or new developers through the logical flow of the entire application, breaking down both the customer-facing experience and the internal administrative operations.

---

## 1. System Overview & Technology

Dolu Logistics is a modern, responsive web application designed to streamline package pickup, delivery tracking, and dispatch management. 

- **Frontend:** Built with React, Vite, and Tailwind CSS (providing the sleek "glassmorphism" aesthetic and responsive mobile design).
- **Backend & Database:** Powered by Supabase (PostgreSQL), handling real-time data storage, tracking IDs, and administrative authentication.
- **Hosting:** Deployed via Vercel for fast, scalable cloud hosting.

---

## 2. The Customer Experience (Frontend Flow)

The public-facing website is designed to be as frictionless as possible for standard users.

### A. Requesting a Pickup
1. **Initiation:** The user navigates to the Request Pickup page (`/request-pickup`).
2. **Form Details:** The user fills in:
   - Sender details (Name, Phone, WhatsApp).
   - Pickup location (State, City, dynamic Area selection).
   - Receiver details.
   - Drop-off location.
   - Package details (Category, Notes).
3. **Dynamic Pricing Engine:** As the user selects the Pickup and Drop-off areas, the system calculates the price automatically.
   - **The "Highest-Zone" Rule:** To maintain profitability, the system queries the fixed Base Price for the Pickup Zone and the Drop-off Zone, and naturally applies the **highest** of the two.
4. **Submission:** Upon submission, the order is securely pushed to the Supabase database. The system automatically generates a unique, sequentially accurate Tracking ID (e.g., `DL20260401003`).

### B. Tracking a Parcel
1. **The Tracking Page (`/track`):** The customer inputs their `DL`-prefixed Tracking ID.
2. **Status Interface:** The system pulls the live data and displays:
   - **Tracking Timeline:** A clear step-by-step history reading exactly how the admin updates it (e.g., *"Your payment has been confirmed"*, *"Rider has been dispatched"*).
   - **Booking Details & Route:** Summarizes where the package is going.
   - **Rider Contact Section:** Displays the rider's name and phone number (dynamically surfacing once an admin assigns them), letting the customer know exactly who to expect.

---

## 3. The Administrative Operations (Admin Flow)

The Admin section (`/admin`) is securely protected and acts as the central hub for dispatchers and managers.

### A. Admin Dashboard
- Provides a high-level view of active metrics (Pending Deliveries, Revenue, Active Riders) to allow for quick operational pulse-checks.

### B. Dispatch Desk
The heart of the logistics operation. Here, admins process all incoming customer requests.
- **Booking Lists:** Admins see all active booking requests in a clean table format.
- **Fast Status Updates:** Operations managers can shift a parcel's status (Pending -> Confirmed -> In Progress -> Delivered) using inline dropdown menus or a detailed modal view.
- **Rider Assignment:** When moving a parcel to 'In Progress', the admin assigns a Rider Name and Phone Number. This data immediately becomes visible on the customer's public tracking timeline!
- **Rapid Communication Tools:**
  - **Copy WhatsApp Summary:** Instantly copies a neatly formatted summary of the entire gig (including Tracking ID, Sender, Receiver, Item, and Payment Details) to easily send to the assigned rider or logistics group chat.
  - **Customer Tracking Update:** Copies a pre-formatted message meant for the customer, providing them with their Tracking ID, exact routing (e.g., *Rumuola ➔ Borikiri*), the assigned rider's contact, and the direct tracking URL.

### C. Reports
A robust tool for accounting and performance analysis.
- **Metrics Filtering:** Admins can select any specific Month and Year.
- **Summary Cards:** Shows Total Bookings, Delivered properties, Canceled operations, and **Revenue** (calculated actively by summing the `price_total` exclusively for successfully 'Delivered' orders).
- **Excel Generation:** A 'Download Monthly Report' button triggers an active export utilizing the `xlsx` library, parsing the month's filtered data into an Excel spreadsheet containing Date, Tracking ID, Customer, Pickup, Drop-off, Rider, and Financial Amount.

### D. Pricing Management
- **Zone Adjustments:** The Administrator can instantly alter the base costs for individual zones across the operating region. Because the 'Highest-Zone' logic controls the checkout form, changing a zone's base price perfectly updates cross-zone trip calculations without touching any code.

### E. Templates & Messages
- Allows the team to review incoming Contact Form messages from prospective corporate clients and standardize communication processes.

---

## 4. Platform Strengths & Value Proposition

When reviewing Dolu Logistics with partners or stakeholders, emphasize the following points:
1. **Automation:** Unique tracking IDs and smart pricing engines save immense manual labor.
2. **Transparency:** Customers always know where their package is and exactly who to call via the robust live-tracking timeline.
3. **Dispatch Efficiency:** The UI is designed specifically to help dispatchers manage hundreds of trips a day without leaving a single screen, making communication out to riders and customers 1-click simple.
4. **Data Driven:** The native Excel reporting guarantees seamless handoffs to the accounting and management teams at the end of every month.
