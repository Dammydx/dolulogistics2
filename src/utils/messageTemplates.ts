/**
 * MESSAGE TEMPLATES
 * Professional message templates for WhatsApp, SMS, and email notifications
 */

export interface TrackingUpdateData {
  tracking_id: string;
  sender_name: string;
  pickup_area: string;
  dropoff_area: string;
  rider_name?: string;
  rider_phone?: string;
}

/**
 * Customer Tracking SMS Update
 * Dynamic template for SMS/WhatsApp tracking updates
 */
export const getTrackingUpdateSMS = (data: TrackingUpdateData): string => {
  return `Dolu Logistics: Tracking Update

Tracking ID: ${data.tracking_id}
Customer: ${data.sender_name}

Route: ${data.pickup_area} ➔ ${data.dropoff_area}
${data.rider_name ? `Rider: ${data.rider_name} (${data.rider_phone || 'N/A'})` : 'Rider: To be assigned'}

Live Tracking: https://dolulogistics.com/track?id=${data.tracking_id}

A rider is on the way for your pickup and delivery. Thank you for trusting Dolu!`;
};

/**
 * WhatsApp Booking Confirmation
 * Copy-friendly format for WhatsApp messages
 */
export interface BookingSummaryData {
  sender_name: string;
  pickup_address: string;
  sender_phone: string;
  item_description: string;
  receiver_name: string;
  dropoff_address: string;
  receiver_phone: string;
  pickup_area?: string;
  dropoff_area?: string;
}

export const getWhatsAppBookingSummary = (data: BookingSummaryData): string => {
  return `Dolu Logistics Booking

PICKUP: ${data.sender_name} | ${data.pickup_address}${data.pickup_area ? ', ' + data.pickup_area : ''} | ${data.sender_phone} | ${data.item_description}
DROP-OFF: ${data.receiver_name} | ${data.dropoff_address}${data.dropoff_area ? ', ' + data.dropoff_area : ''} | ${data.receiver_phone}

A rider is being assigned. Thanks for trusting Dolu! ❤️

PAYMENT:
4005159115 | Moniepoint | Dolu Logistics LTD
Send proof of payment for confirmation. Thanks! ❤️`;
};

/**
 * Customer-facing status labels
 */
export const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  pending: 'Payment Pending',
  confirmed: 'Your payment has been confirmed.',
  in_progress: 'Rider has been dispatched, you will be contacted.',
  delivered: 'Delivered! Thanks for choosing Dolu Logistics.',
  not_accepted: 'Booking Not Accepted',
  cancelled: 'Booking Cancelled',
};
