import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Package, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { Parcel } from '../../types/supabase';
import TrackingDetails from './components/TrackingDetails';
import TrackingSteps from './components/TrackingSteps';

const TrackPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTrackingId = queryParams.get('id') || '';
  
  const [trackingId, setTrackingId] = useState(initialTrackingId);
  const [isLoading, setIsLoading] = useState(false);
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [riderName, setRiderName] = useState<string>('');
  const [riderPhone, setRiderPhone] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Fetch parcel data when component mounts if we have an initial tracking ID
  useEffect(() => {
    if (initialTrackingId) {
      handleSearch();
    }
  }, [initialTrackingId]);

  const handleSearch = async () => {
    if (!trackingId.trim()) {
      toast.error('Please enter a tracking ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRiderName('');
    setRiderPhone('');
    
    try {
      // First, try to fetch from bookings table (primary system)
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('tracking_id', trackingId)
        .single();
      
      if (!bookingError && bookingData) {
        // Create a parcel-like object from booking data
        const parcelFromBooking: Parcel = {
          id: bookingData.id,
          tracking_id: bookingData.tracking_id,
          sender_name: bookingData.sender_name,
          sender_phone: bookingData.sender_phone,
          sender_address: bookingData.pickup_address,
          receiver_name: bookingData.receiver_name,
          receiver_phone: bookingData.receiver_phone,
          receiver_address: bookingData.dropoff_address,
          origin_city: 'N/A',
          destination_city: 'N/A',
          status: bookingData.status as any,
          weight_kg: 0,
          delivery_notes: bookingData.item_notes || undefined,
          expected_delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: bookingData.created_at,
          updated_at: bookingData.updated_at,
        };
        
        setParcel(parcelFromBooking);
        
        // Set rider info (even if empty)
        console.log('Booking Data:', bookingData);
        console.log('Rider Name:', bookingData.rider_name);
        console.log('Rider Phone:', bookingData.rider_phone);
        
        setRiderName(bookingData.rider_name || '');
        setRiderPhone(bookingData.rider_phone || '');
        console.log('State updated - Rider Name:', bookingData.rider_name, 'Rider Phone:', bookingData.rider_phone);
        return;
      }
      
      // Fallback: try parcels table
      const { data, error } = await supabase
        .from('parcels')
        .select('*')
        .eq('tracking_id', trackingId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setParcel(data as unknown as Parcel);
      } else {
        setError('No parcel found with this tracking ID');
        toast.error('No parcel found with this tracking ID');
      }
    } catch (err) {
      console.error('Error fetching parcel:', err);
      setError('Error fetching parcel information. Please try again.');
      toast.error('Error fetching parcel information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="pt-20 pb-20 min-h-screen bg-gradient-to-b from-background to-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Track Your Parcel</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter your tracking number to get real-time updates on your parcel's current status and location.
            </p>
          </div>
          
          {/* Tracking Form */}
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
                  placeholder="Enter your tracking number"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-md font-medium hover:bg-primary-600 transition-colors flex items-center justify-center disabled:bg-gray-400"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
                {parcel && (
                  <button
                    type="button"
                    onClick={() => handleSearch()}
                    disabled={isLoading}
                    className="px-4 py-3 bg-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-400 transition-colors"
                    title="Refresh to get latest rider info"
                  >
                    🔄
                  </button>
                )}
              </div>
            </form>
          </motion.div>
          
          {/* Results */}
          {error && (
            <motion.div 
              className="bg-red-50 p-6 rounded-lg border border-red-200 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">Parcel Not Found</h3>
              <p className="text-red-600">
                We couldn't find any parcel with the tracking number <span className="font-medium">{trackingId}</span>. 
                Please check the number and try again.
              </p>
            </motion.div>
          )}
          
          {parcel && (
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <TrackingSteps status={parcel.status} />
              <TrackingDetails parcel={parcel} riderName={riderName} riderPhone={riderPhone} />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TrackPage;