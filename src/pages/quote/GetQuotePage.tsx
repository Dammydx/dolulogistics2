/**
 * GET QUOTE PAGE
 *
 * Allows customers to get instant price estimates without creating a booking.
 *
 * FLOW:
 * 1. Customer selects pickup location (State → City → Area)
 * 2. Customer selects dropoff location (State → City → Area)
 * 3. Customer selects optional add-ons (Fragile, Express)
 * 4. System calculates and displays price instantly
 * 5. Customer can click "Continue to Request Pickup" to book
 * 6. Selected locations are passed to Request Pickup form (prefilled)
 *
 * PRICING CALCULATION:
 * - Area → Zone lookup
 * - Zone-to-zone rate + add-ons
 * - See utils/pricing.ts for detailed logic
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, MapPin, Package, ArrowRight, Info } from 'lucide-react';
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
import type { State, City, Area, Addon, PriceQuote } from '../../types/database';

const GetQuotePage = () => {
  const navigate = useNavigate();

  // States data
  const [states, setStates] = useState<State[]>([]);

  // Pickup location
  const [pickupStateId, setPickupStateId] = useState('');
  const [pickupCities, setPickupCities] = useState<City[]>([]);
  const [pickupCityId, setPickupCityId] = useState('');
  const [pickupAreas, setPickupAreas] = useState<Area[]>([]);
  const [pickupAreaId, setPickupAreaId] = useState('');

  // Dropoff location
  const [dropoffStateId, setDropoffStateId] = useState('');
  const [dropoffCities, setDropoffCities] = useState<City[]>([]);
  const [dropoffCityId, setDropoffCityId] = useState('');
  const [dropoffAreas, setDropoffAreas] = useState<Area[]>([]);
  const [dropoffAreaId, setDropoffAreaId] = useState('');

  // Add-ons
  const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Price quote
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [statesData, addonsData] = await Promise.all([fetchStates(), fetchAddons()]);
      setStates(statesData);
      setAvailableAddons(addonsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load location data');
    }
  };

  // Pickup state changed → load cities
  useEffect(() => {
    if (pickupStateId) {
      fetchCitiesByState(pickupStateId).then(setPickupCities);
      setPickupCityId('');
      setPickupAreaId('');
    }
  }, [pickupStateId]);

  // Pickup city changed → load areas
  useEffect(() => {
    if (pickupCityId) {
      fetchAreasByCity(pickupCityId).then(setPickupAreas);
      setPickupAreaId('');
    }
  }, [pickupCityId]);

  // Dropoff state changed → load cities
  useEffect(() => {
    if (dropoffStateId) {
      fetchCitiesByState(dropoffStateId).then(setDropoffCities);
      setDropoffCityId('');
      setDropoffAreaId('');
    }
  }, [dropoffStateId]);

  // Dropoff city changed → load areas
  useEffect(() => {
    if (dropoffCityId) {
      fetchAreasByCity(dropoffCityId).then(setDropoffAreas);
      setDropoffAreaId('');
    }
  }, [dropoffCityId]);

  // Auto-calculate when both areas selected
  useEffect(() => {
    if (pickupAreaId && dropoffAreaId) {
      handleCalculate();
    } else {
      setQuote(null);
    }
  }, [pickupAreaId, dropoffAreaId, selectedAddons]);

  const handleCalculate = async () => {
    if (!pickupAreaId || !dropoffAreaId) return;

    setIsCalculating(true);

    try {
      const result = await calculatePriceQuote(pickupAreaId, dropoffAreaId, selectedAddons);
      setQuote(result);

      if (!result.success) {
        toast.error(result.error || 'Failed to calculate price');
      }
    } catch (error) {
      console.error('Error calculating quote:', error);
      toast.error('Failed to calculate price');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddonToggle = (addonCode: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonCode) ? prev.filter((c) => c !== addonCode) : [...prev, addonCode]
    );
  };

  const handleContinueToBooking = () => {
    if (!quote?.success) {
      toast.error('Please select pickup and dropoff locations first');
      return;
    }

    // Navigate to Request Pickup with prefilled data
    navigate('/request-pickup', {
      state: {
        prefill: {
          pickupStateId,
          pickupCityId,
          pickupAreaId,
          dropoffStateId,
          dropoffCityId,
          dropoffAreaId,
          selectedAddons,
          quote,
        },
      },
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
              <Calculator className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Get Instant Quote</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select your pickup and delivery locations to get an instant price estimate. No commitment required.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pickup Location Card */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-primary-500" />
                  Pickup Location
                </h3>

                <div className="space-y-4">
                  {/* Pickup State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select
                      value={pickupStateId}
                      onChange={(e) => setPickupStateId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="">Select State</option>
                      {statesToOptions(states).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pickup City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <select
                      value={pickupCityId}
                      onChange={(e) => setPickupCityId(e.target.value)}
                      disabled={!pickupStateId}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select City</option>
                      {citiesToOptions(pickupCities).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pickup Area */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                    <select
                      value={pickupAreaId}
                      onChange={(e) => setPickupAreaId(e.target.value)}
                      disabled={!pickupCityId}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              </motion.div>

              {/* Dropoff Location Card */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-accent-500" />
                  Dropoff Location
                </h3>

                <div className="space-y-4">
                  {/* Dropoff State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select
                      value={dropoffStateId}
                      onChange={(e) => setDropoffStateId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="">Select State</option>
                      {statesToOptions(states).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dropoff City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <select
                      value={dropoffCityId}
                      onChange={(e) => setDropoffCityId(e.target.value)}
                      disabled={!dropoffStateId}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select City</option>
                      {citiesToOptions(dropoffCities).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dropoff Area */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                    <select
                      value={dropoffAreaId}
                      onChange={(e) => setDropoffAreaId(e.target.value)}
                      disabled={!dropoffCityId}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              </motion.div>

              {/* Add-ons Card */}
              {availableAddons.length > 0 && (
                <motion.div
                  className="bg-white rounded-lg shadow-md p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
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

            {/* Right: Quote Display */}
            <div className="lg:col-span-1">
              <motion.div
                className="bg-white rounded-lg shadow-md p-6 sticky top-24"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <h3 className="text-xl font-semibold mb-4">Price Estimate</h3>

                {isCalculating ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="text-gray-500 mt-3">Calculating...</p>
                  </div>
                ) : quote?.success ? (
                  <div className="space-y-4">
                    {/* Base Price */}
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Base Price</span>
                      <span className="font-medium">{formatPrice(quote.base_price)}</span>
                    </div>

                    {/* Add-ons */}
                    {quote.addons_price > 0 && (
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Add-ons</span>
                        <span className="font-medium">{formatPrice(quote.addons_price)}</span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between py-3 bg-primary-50 px-4 rounded-md">
                      <span className="font-semibold text-lg">Total</span>
                      <span className="font-bold text-2xl text-primary-600">
                        {formatPrice(quote.total_price)}
                      </span>
                    </div>

                    {/* ETA */}
                    {quote.eta_text && (
                      <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-md">
                        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <div className="font-medium">Estimated Delivery Time</div>
                          <div>{quote.eta_text}</div>
                        </div>
                      </div>
                    )}

                    {/* Continue Button */}
                    <button
                      onClick={handleContinueToBooking}
                      className="w-full px-6 py-3 bg-primary-500 text-white rounded-md font-medium hover:bg-primary-600 transition-colors flex items-center justify-center"
                    >
                      Continue to Request Pickup
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Select pickup and dropoff locations to see pricing</p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GetQuotePage;
