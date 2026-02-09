/**
 * REQUEST PICKUP PAGE (NEW VERSION)
 *
 * Comprehensive booking form for customers to request parcel pickup and delivery.
 *
 * KEY FEATURES:
 * - NO customer email (as per requirements)
 * - Full address dropdowns (State → City → Area) for pickup and dropoff
 * - WhatsApp fields with "same as phone" checkbox convenience
 * - Item category selection from database
 * - Real-time price calculation and display
 * - Prefill support from Get Quote page
 * - Generates tracking ID starting with "DL"
 * - Creates booking + initial history entry
 * - Displays tracking ID on success
 *
 * FORM STRUCTURE:
 * 1. Sender Information (name, phone, whatsapp)
 * 2. Pickup Location (state, city, area, address, landmark)
 * 3. Receiver Information (name, phone, whatsapp)
 * 4. Dropoff Location (state, city, area, address, landmark)
 * 5. Item Category + Notes
 * 6. Price Preview (auto-calculated)
 * 7. Submit → Creates booking with tracking ID
 */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Send,
  User,
  MapPin,
  Phone,
  MessageSquare,
  FileText,
  DollarSign,
  ArrowLeft,
  Home,
  Check,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  fetchStates,
  fetchCitiesByState,
  fetchAreasByCity,
  statesToOptions,
  citiesToOptions,
  areasToOptions,
} from '../../utils/locations';
import { calculatePriceQuote, fetchAddons, formatPrice } from '../../utils/pricing';
import { createBooking, fetchItemCategories } from '../../utils/bookings';
import type { State, City, Area, Addon, ItemCategory, PriceQuote } from '../../types/database';

const NewRequestPickupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we have prefill data from Get Quote
  const prefillData = location.state?.prefill;

  // Success state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reference data
  const [states, setStates] = useState<State[]>([]);
  const [itemCategories, setItemCategories] = useState<ItemCategory[]>([]);
  const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);

  // Sender
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderWhatsapp, setSenderWhatsapp] = useState('');
  const [senderWhatsappSame, setSenderWhatsappSame] = useState(false);

  // Pickup Location
  const [pickupStateId, setPickupStateId] = useState('');
  const [pickupCities, setPickupCities] = useState<City[]>([]);
  const [pickupCityId, setPickupCityId] = useState('');
  const [pickupAreas, setPickupAreas] = useState<Area[]>([]);
  const [pickupAreaId, setPickupAreaId] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLandmark, setPickupLandmark] = useState('');

  // Receiver
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverWhatsapp, setReceiverWhatsapp] = useState('');
  const [receiverWhatsappSame, setReceiverWhatsappSame] = useState(false);

  // Dropoff Location
  const [dropoffStateId, setDropoffStateId] = useState('');
  const [dropoffCities, setDropoffCities] = useState<City[]>([]);
  const [dropoffCityId, setDropoffCityId] = useState('');
  const [dropoffAreas, setDropoffAreas] = useState<Area[]>([]);
  const [dropoffAreaId, setDropoffAreaId] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLandmark, setDropoffLandmark] = useState('');

  // Item
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  // Add-ons
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Price Quote
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [statesData, categoriesData, addonsData] = await Promise.all([
        fetchStates(),
        fetchItemCategories(),
        fetchAddons(),
      ]);

      setStates(statesData);
      setItemCategories(categoriesData);
      setAvailableAddons(addonsData);

      // Apply prefill data if available
      if (prefillData) {
        setPickupStateId(prefillData.pickupStateId || '');
        setPickupCityId(prefillData.pickupCityId || '');
        setPickupAreaId(prefillData.pickupAreaId || '');
        setDropoffStateId(prefillData.dropoffStateId || '');
        setDropoffCityId(prefillData.dropoffCityId || '');
        setDropoffAreaId(prefillData.dropoffAreaId || '');
        setSelectedAddons(prefillData.selectedAddons || []);

        if (prefillData.quote) {
          setQuote(prefillData.quote);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load form data');
    }
  };

  // Pickup state changed
  useEffect(() => {
    if (pickupStateId) {
      fetchCitiesByState(pickupStateId).then(setPickupCities);
      if (!prefillData) {
        setPickupCityId('');
        setPickupAreaId('');
      }
    }
  }, [pickupStateId]);

  // Pickup city changed
  useEffect(() => {
    if (pickupCityId) {
      fetchAreasByCity(pickupCityId).then(setPickupAreas);
      if (!prefillData) {
        setPickupAreaId('');
      }
    }
  }, [pickupCityId]);

  // Dropoff state changed
  useEffect(() => {
    if (dropoffStateId) {
      fetchCitiesByState(dropoffStateId).then(setDropoffCities);
      if (!prefillData) {
        setDropoffCityId('');
        setDropoffAreaId('');
      }
    }
  }, [dropoffStateId]);

  // Dropoff city changed
  useEffect(() => {
    if (dropoffCityId) {
      fetchAreasByCity(dropoffCityId).then(setDropoffAreas);
      if (!prefillData) {
        setDropoffAreaId('');
      }
    }
  }, [dropoffCityId]);

  // Auto-calculate price when areas change
  useEffect(() => {
    if (pickupAreaId && dropoffAreaId) {
      calculatePrice();
    } else {
      setQuote(null);
    }
  }, [pickupAreaId, dropoffAreaId, selectedAddons]);

  // Sender WhatsApp same as phone
  useEffect(() => {
    if (senderWhatsappSame) {
      setSenderWhatsapp(senderPhone);
    }
  }, [senderWhatsappSame, senderPhone]);

  // Receiver WhatsApp same as phone
  useEffect(() => {
    if (receiverWhatsappSame) {
      setReceiverWhatsapp(receiverPhone);
    }
  }, [receiverWhatsappSame, receiverPhone]);

  const calculatePrice = async () => {
    setIsCalculatingPrice(true);

    try {
      const result = await calculatePriceQuote(pickupAreaId, dropoffAreaId, selectedAddons);
      setQuote(result);

      if (!result.success) {
        toast.error(result.error || 'Failed to calculate price');
      }
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  const handleAddonToggle = (addonCode: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonCode) ? prev.filter((c) => c !== addonCode) : [...prev, addonCode]
    );
  };

  const validateForm = (): boolean => {
    if (!senderName || !senderPhone) {
      toast.error('Please provide sender information');
      return false;
    }

    if (!pickupStateId || !pickupCityId || !pickupAreaId || !pickupAddress) {
      toast.error('Please provide complete pickup location');
      return false;
    }

    if (!receiverName || !receiverPhone) {
      toast.error('Please provide receiver information');
      return false;
    }

    if (!dropoffStateId || !dropoffCityId || !dropoffAreaId || !dropoffAddress) {
      toast.error('Please provide complete dropoff location');
      return false;
    }

    if (!itemCategoryId) {
      toast.error('Please select item category');
      return false;
    }

    if (!quote?.success) {
      toast.error('Price calculation failed. Please check your locations.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const newTrackingId = await createBooking({
        sender_name: senderName,
        sender_phone: senderPhone,
        sender_whatsapp: senderWhatsapp || undefined,
        pickup_state_id: pickupStateId,
        pickup_city_id: pickupCityId,
        pickup_area_id: pickupAreaId,
        pickup_address: pickupAddress,
        pickup_landmark: pickupLandmark || undefined,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        receiver_whatsapp: receiverWhatsapp || undefined,
        dropoff_state_id: dropoffStateId,
        dropoff_city_id: dropoffCityId,
        dropoff_area_id: dropoffAreaId,
        dropoff_address: dropoffAddress,
        dropoff_landmark: dropoffLandmark || undefined,
        item_category_id: itemCategoryId,
        item_notes: itemNotes || undefined,
        price_base: quote!.base_price,
        price_addons: quote!.addons_price,
        price_total: quote!.total_price,
        addons_selected: selectedAddons.length > 0 ? selectedAddons : undefined,
      });

      setTrackingId(newTrackingId);
      setIsSubmitted(true);
      toast.success('Booking created successfully!');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-gradient-to-b from-background to-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Success Icon */}
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>

            {/* Success Message */}
            <h2 className="text-2xl font-bold mb-4 text-center">Booking Received!</h2>
            <p className="text-gray-600 mb-6 text-center">
              Your booking has been successfully created. Our customer care team will call you shortly to confirm the details.
            </p>

            {/* Tracking ID Display */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 mb-1">Your Tracking ID:</div>
              <div className="text-2xl font-bold text-primary-600 tracking-wider">{trackingId}</div>
              <div className="text-sm text-gray-500 mt-2">
                Save this ID to track your parcel
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => navigate(`/track?id=${trackingId}`)}
                className="w-full px-6 py-3 bg-primary-500 text-white rounded-md font-medium hover:bg-primary-600 transition-colors"
              >
                Track My Parcel
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main Form
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
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Request a Pickup</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Fill in the details below to book your parcel delivery. Our team will contact you shortly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Sender & Pickup */}
              <div className="lg:col-span-2 space-y-6">
                {/* Sender Information */}
                <motion.div
                  className="bg-white rounded-lg shadow-md p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-primary-500" />
                    Sender Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                        placeholder="+234 XXX XXX XXXX"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WhatsApp Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={senderWhatsapp}
                        onChange={(e) => {
                          setSenderWhatsapp(e.target.value);
                          setSenderWhatsappSame(false);
                        }}
                        disabled={senderWhatsappSame}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-gray-100"
                        placeholder="+234 XXX XXX XXXX"
                      />
                      <label className="flex items-center mt-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={senderWhatsappSame}
                          onChange={(e) => setSenderWhatsappSame(e.target.checked)}
                          className="mr-2"
                        />
                        Same as phone number
                      </label>
                    </div>
                  </div>
                </motion.div>

                {/* Pickup Location */}
                <motion.div
                  className="bg-white rounded-lg shadow-md p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-primary-500" />
                    Pickup Location
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={pickupStateId}
                          onChange={(e) => setPickupStateId(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                          required
                        >
                          <option value="">Select State</option>
                          {statesToOptions(states).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={pickupCityId}
                          onChange={(e) => setPickupCityId(e.target.value)}
                          disabled={!pickupStateId}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-gray-100"
                          required
                        >
                          <option value="">Select City</option>
                          {citiesToOptions(pickupCities).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Area <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={pickupAreaId}
                          onChange={(e) => setPickupAreaId(e.target.value)}
                          disabled={!pickupCityId}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-gray-100"
                          required
                        >
                          <option value="">Select Area</option>
                          {areasToOptions(pickupAreas).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                        placeholder="House/Building number and street name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={pickupLandmark}
                        onChange={(e) => setPickupLandmark(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                        placeholder="Nearby landmark or building"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Receiver Information */}
                <motion.div
                  className="bg-white rounded-lg shadow-md p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-accent-500" />
                    Receiver Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={receiverPhone}
                        onChange={(e) => setReceiverPhone(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                        placeholder="+234 XXX XXX XXXX"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WhatsApp Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={receiverWhatsapp}
                        onChange={(e) => {
                          setReceiverWhatsapp(e.target.value);
                          setReceiverWhatsappSame(false);
                        }}
                        disabled={receiverWhatsappSame}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-gray-100"
                        placeholder="+234 XXX XXX XXXX"
                      />
                      <label className="flex items-center mt-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={receiverWhatsappSame}
                          onChange={(e) => setReceiverWhatsappSame(e.target.checked)}
                          className="mr-2"
                        />
                        Same as phone number
                      </label>
                    </div>
                  </div>
                </motion.div>

                {/* Dropoff Location */}
                <motion.div
                  className="bg-white rounded-lg shadow-md p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-accent-500" />
                    Dropoff Location
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={dropoffStateId}
                          onChange={(e) => setDropoffStateId(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                          required
                        >
                          <option value="">Select State</option>
                          {statesToOptions(states).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={dropoffCityId}
                          onChange={(e) => setDropoffCityId(e.target.value)}
                          disabled={!dropoffStateId}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-gray-100"
                          required
                        >
                          <option value="">Select City</option>
                          {citiesToOptions(dropoffCities).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Area <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={dropoffAreaId}
                          onChange={(e) => setDropoffAreaId(e.target.value)}
                          disabled={!dropoffCityId}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-gray-100"
                          required
                        >
                          <option value="">Select Area</option>
                          {areasToOptions(dropoffAreas).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={dropoffAddress}
                        onChange={(e) => setDropoffAddress(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                        placeholder="House/Building number and street name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={dropoffLandmark}
                        onChange={(e) => setDropoffLandmark(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                        placeholder="Nearby landmark or building"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Item Details */}
                <motion.div
                  className="bg-white rounded-lg shadow-md p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-primary-500" />
                    Item Details
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={itemCategoryId}
                        onChange={(e) => setItemCategoryId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                        required
                      >
                        <option value="">Select Category</option>
                        {itemCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={itemNotes}
                        onChange={(e) => setItemNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                        placeholder="Any special handling instructions or additional details..."
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Add-ons */}
                {availableAddons.length > 0 && (
                  <motion.div
                    className="bg-white rounded-lg shadow-md p-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                  >
                    <h3 className="text-xl font-semibold mb-4">Optional Add-ons</h3>
                    <div className="space-y-3">
                      {availableAddons.map((addon) => (
                        <label
                          key={addon.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedAddons.includes(addon.code)}
                              onChange={() => handleAddonToggle(addon.code)}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <div className="ml-3">
                              <div className="font-medium">{addon.name}</div>
                              {addon.description && (
                                <div className="text-sm text-gray-500">{addon.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="font-semibold text-primary-600">
                            +{formatPrice(addon.fee)}
                          </div>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Column: Price Summary (Sticky) */}
              <div className="lg:col-span-1">
                <motion.div
                  className="bg-white rounded-lg shadow-md p-6 sticky top-24"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-primary-500" />
                    Price Summary
                  </h3>

                  {isCalculatingPrice ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                      <p className="text-gray-500 mt-3 text-sm">Calculating...</p>
                    </div>
                  ) : quote?.success ? (
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Base Price</span>
                        <span className="font-medium">{formatPrice(quote.base_price)}</span>
                      </div>

                      {quote.addons_price > 0 && (
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">Add-ons</span>
                          <span className="font-medium">{formatPrice(quote.addons_price)}</span>
                        </div>
                      )}

                      <div className="flex justify-between py-3 bg-primary-50 px-4 rounded-md">
                        <span className="font-semibold text-lg">Total</span>
                        <span className="font-bold text-2xl text-primary-600">
                          {formatPrice(quote.total_price)}
                        </span>
                      </div>

                      {quote.eta_text && (
                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                          <div className="font-medium mb-1">Estimated Delivery</div>
                          <div>{quote.eta_text}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Select pickup and dropoff locations to see pricing
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !quote?.success}
                    className="w-full px-6 py-3 bg-primary-500 text-white rounded-md font-medium hover:bg-primary-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center mt-6"
                  >
                    {isSubmitting ? (
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
                        Creating Booking...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Send className="w-5 h-5 mr-2" />
                        Submit Booking
                      </span>
                    )}
                  </button>
                </motion.div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default NewRequestPickupPage;
