

# 📋 Dev Spec Update: Pricing & Payment Workflow (v1.1)

## **1. Database & Infrastructure Migration**
* **Action:** Switch to the new Supabase account.
* **Environment Variables:** Update `.env` with the new `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
* **Migration:** Re-run migrations **001 through 008** on the new Supabase project to initialize the schema (Locations, Pricing, Bookings, etc.).

## **2. Pricing Engine Update (`src/utils/pricing.ts`)**
Update the pricing logic and database seeds to match the new Port Harcourt zone-based rates:

| Zone Price | Areas Included |
| :--- | :--- |
| **₦2,500** | NTA, Ada George, Ozuoba, Mgbuogba, Rumuokwuta, Rumuigbo, Mile 4, Agip, Mile 3, UST, Iwofe, Ogbogoro, New Road, Egbelu, Rumuokoro, Obirikwere |
| **₦3,000** | Rumuola, Mile 2, Mile 1, GRA, Olu Obasanjo, Sani Abacha, Waterlines, Air Force, Artillery, Garrison, Orazi, Nkpogu, Stadium Road, Elekahia, Rumukalagbor, UST backgate, DLine, Rumuomasi, Rumudara, Rumuibekwe, Eliozu, Sars Road, Rumuodumaya, Rumuagholu, Rukpakulusi, Alakahia, Rumuekini |
| **₦3,500** | Eagle Island, Choba, Aluu, Peter Odili, Old GRA, Woji, Eastern By Pass, Ogbunabali, Trans Amadi, Abuloma, Marine Base, Creek Road, Town, Rumukrushni |
| **₦4,000** | Borikiri, Elelenwo, Eneka |
| **₦5,000-6,000** | Atali, Akpajo, Eleme Junction, Igwuruta, Airport, Oyigbo, Igbo-Etche |

## **3. Frontend: Request Pickup Success Flow**
Modify `NewRequestPickupPage.tsx` to include a **Payment Information Card** upon successful booking.

* **Bank Details to Display:**
    * **Bank:** Moniepoint
    * **Account Name:** Dolu logistics LTD
    * **Account Number:** `4005159115`
* **Features:**
    * Implement a **"Copy Account Number"** button.
    * Add a **"Send Proof to WhatsApp"** button that redirects the user to the customer care WhatsApp with their `tracking_id`.

## **4. Admin Panel: Dispatch Desk Enhancement**
Modify `AdminBookings.tsx` (Booking Detail View) to assist the Customer Care manager.

* **Feature:** Add a **"Copy Booking Summary"** button.
* **Functionality:** When clicked, it should copy a formatted string to the clipboard for easy pasting into WhatsApp.
* **Template Format:**
    > **PICKUP:** [Sender Name], [Address], [Phone], [Item]
    > **DROP-OFF:** [Receiver Name], [Address], [Phone]
    > **PAYMENT:** 4005159115 (Moniepoint)
    > *Please send proof of payment for confirmation.*

## **5. UI/UX Requirements**
* **Styling:** Use **Tailwind CSS**. Ensure the payment card looks premium (clean borders, `bg-slate-50`, and clear typography).
* **Interactivity:** Use **Framer Motion** for the entry animation of the success modal.

---

Admin Panel: WhatsApp Summary Tool (you should know where to put this so that like its easier abi )
To make things easy for the customer care lady, add a "Copy WhatsApp Summary" button in the Booking Detail view.

Logic: When clicked, it must pull the specific record from the bookings table and format it into this exact string:

For booking please, kindly type out your delivery details in the format below:

PICKUP:
Name: {sender_name}
Address: {pickup_address}, {pickup_area}
Sender’s Phone Number: {sender_phone}
Nature of item: {item_notes}

DROP-OFF:
Name: {receiver_name}
Address: {dropoff_address}, {dropoff_area}
Receiver’s Phone Number: {receiver_phone}

Please hold on, a rider will be assigned to you shortly for pickup. Thank you for trusting Dolu logistics ❤️

Please make payment to the company's account below:
4005159115
Dolu logistics LTD
Moniepoint

Please send a screenshot or proof of payment for confirmation. Thank you so much ❤️