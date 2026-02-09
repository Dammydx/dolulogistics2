/**
 * TRACK PARCEL PAGE (NEW VERSION)
 *
 * Allows customers to track their parcel using the tracking ID.
 * Displays booking details and timeline of status updates.
 *
 * KEY FEATURES:
 * - Search by tracking ID (format: DL20240209001)
 * - Show current booking status
 * - Display timeline from booking_status_history table
 * - Show sender/receiver info, addresses
 * - Show price details
 * - Customer care contact buttons
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Package, Search, AlertTriangle, Phone, MessageCircle, MapPin, Calendar, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { fetchBookingByTrackingId, fetchBookingHistory, getStatusLabel, getStatusColor } from '../../utils/bookings';
import { getAreaName } from '../../utils/locations';
import { formatPrice } from '../../utils/pricing';
import type { Booking, BookingStatusHistory } from '../../types/database';

const NewTrackPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTrackingId = queryParams.get('id') || '';

  const [trackingId, setTrackingId] = useState(initialTrackingId);
  const [isLoading, setIsLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [history, setHistory] = useState<BookingStatusHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pickupAreaName, setPickupAreaName] = useState('');
  const [dropoffAreaName, setDropoffAreaName] = useState('');

  // Auto-search if tracking ID in URL
  useEffect(() => {
    if (initialTrackingId) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    if (!trackingId.trim()) {
      toast.error('Please enter a tracking ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const bookingData = await fetchBookingByTrackingId(trackingId);

      if (!bookingData) {
        setError('No booking found with this tracking ID');
        toast.error('No booking found with this tracking ID');
        setBooking(null);
        setHistory([]);
        return;
      }

      setBooking(bookingData);

      // Fetch history
      const historyData = await fetchBookingHistory(bookingData.id);
      setHistory(historyData);

      // Fetch area names
      if (bookingData.pickup_area_id) {
        const name = await getAreaName(bookingData.pickup_area_id);
        setPickupAreaName(name);
      }

      if (bookingData.dropoff_area_id) {
        const name = await getAreaName(bookingData.dropoff_area_id);
        setDropoffAreaName(name);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Error fetching booking information. Please try again.');
      toast.error('Error fetching booking information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-gradient-to-b from-background to-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Package className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Track Your Parcel</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter your tracking ID to get real-time updates on your parcel's status and location.
            </p>
          </div>

          {/* Search Form */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md mb-8"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Package className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Enter tracking ID (e.g., DL20240209001)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-primary-500 text-white rounded-md font-medium hover:bg-primary-600 transition-colors flex items-center justify-center disabled:bg-gray-400"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Tracking...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Search className="w-5 h-5 mr-2" />
                    Track Parcel
                  </span>
                )}
              </button>
            </form>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              className="bg-red-50 p-6 rounded-lg border border-red-200 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">Booking Not Found</h3>
              <p className="text-red-600">
                We couldn't find any booking with tracking ID <span className="font-medium">{trackingId}</span>.
                Please check the ID and try again.
              </p>
            </motion.div>
          )}

          {/* Booking Details */}
          {booking && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Status Card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Booking Details</h2>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">Tracking ID:</span>
                      <span className="font-bold text-lg">{booking.tracking_id}</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Route Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-primary-500" />
                      Route
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Pickup</p>
                        <p className="font-medium">{pickupAreaName}</p>
                        <p className="text-sm text-gray-600">{booking.pickup_address}</p>
                      </div>
                      <div className="flex justify-center">
                        <div className="w-0.5 h-6 bg-gray-300"></div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dropoff</p>
                        <p className="font-medium">{dropoffAreaName}</p>
                        <p className="text-sm text-gray-600">{booking.dropoff_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <User className="w-5 h-5 mr-2 text-primary-500" />
                      Contact
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Sender</p>
                        <p className="font-medium">{booking.sender_name}</p>
                        <p className="text-sm text-gray-600">{booking.sender_phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Receiver</p>
                        <p className="font-medium">{booking.receiver_name}</p>
                        <p className="text-sm text-gray-600">{booking.receiver_phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Price Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">Price</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="font-bold text-xl text-primary-600">
                        {formatPrice(booking.price_total)}
                      </span>
                    </div>
                  </div>

                  {/* Date Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-primary-500" />
                      Booking Date
                    </h3>
                    <p className="text-gray-700">{formatDate(booking.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {history.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-6">Status Timeline</h3>
                  <div className="space-y-4">
                    {history.map((entry, index) => (
                      <div key={entry.id} className="flex">
                        <div className="flex flex-col items-center mr-4">
                          <div className={`w-3 h-3 rounded-full ${index === history.length - 1 ? 'bg-primary-500' : 'bg-gray-300'}`}></div>
                          {index < history.length - 1 && <div className="w-0.5 flex-grow bg-gray-300 mt-1"></div>}
                        </div>
                        <div className="flex-grow pb-6">
                          <div className="flex justify-between items-start mb-1">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                              {getStatusLabel(entry.status)}
                            </span>
                            <span className="text-sm text-gray-500">{formatDate(entry.created_at)}</span>
                          </div>
                          <p className="text-gray-700 mt-2">{entry.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Care */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
                <p className="text-gray-700 mb-4">
                  Contact our customer care team for assistance with your delivery.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="tel:+2349130278580"
                    className="flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Us
                  </a>
                  <a
                    href="https://wa.me/2349130278580"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default NewTrackPage;
