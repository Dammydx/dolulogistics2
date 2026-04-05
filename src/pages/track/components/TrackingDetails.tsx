import { motion } from 'framer-motion';
import { Calendar, MapPin, User, Package } from 'lucide-react';
import { Parcel } from '../../../types/supabase';


type TrackingDetailsProps = {
  parcel: Parcel;
  riderName?: string;
  riderPhone?: string;
};

const statusLabels: Record<string, string> = {
  'awaiting_pickup': 'Awaiting Pickup',
  'in_transit': 'In Transit',
  'out_for_delivery': 'Out for Delivery',
  'delivered': 'Delivered',
  'delayed': 'Delayed',
  'cancelled': 'Cancelled',
};

const statusColors: Record<string, string> = {
  'awaiting_pickup': 'bg-amber-50 text-amber-700',
  'in_transit': 'bg-blue-50 text-blue-700',
  'out_for_delivery': 'bg-accent-50 text-accent-700',
  'delivered': 'bg-emerald-50 text-emerald-700',
  'delayed': 'bg-amber-50 text-amber-700',
  'cancelled': 'bg-red-50 text-red-700',
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const TrackingDetails = ({ parcel, riderName, riderPhone }: TrackingDetailsProps) => {
  console.log('TrackingDetails Props:', { riderName, riderPhone });
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Tracking Details</h2>
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">Tracking Number:</span>
              <span className="font-medium">{parcel.tracking_id}</span>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[parcel.status]}`}>
              {statusLabels[parcel.status]}
            </span>
          </div>
        </div>
      </div>
      
      {/* Details Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Origin & Destination */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary-500" />
                Shipment Route
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Origin</p>
                  <p className="font-medium">{parcel.origin_city}</p>
                </div>
                <div className="flex justify-center">
                  <div className="w-0.5 h-8 bg-gray-300"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="font-medium">{parcel.destination_city}</p>
                </div>
              </div>
            </div>
            
            {/* Dates */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary-500" />
                Important Dates
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date Shipped:</span>
                  <span>{formatDate(parcel.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expected Delivery:</span>
                  <span>{formatDate(parcel.expected_delivery_date)}</span>
                </div>
                {parcel.actual_delivery_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Actual Delivery:</span>
                    <span>{formatDate(parcel.actual_delivery_date)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated:</span>
                  <span>{formatDate(parcel.updated_at)}</span>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Sender & Receiver & Rider */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-500" />
                Contact
              </h3>
              <div className="space-y-4">
                {/* Sender */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sender</p>
                  <p className="font-medium">{parcel.sender_name}</p>
                  <p className="text-sm text-gray-600">{parcel.sender_phone}</p>
                  <p className="text-sm text-gray-600 mt-1">{parcel.sender_address}</p>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Receiver */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Receiver</p>
                  <p className="font-medium">{parcel.receiver_name}</p>
                  <p className="text-sm text-gray-600">{parcel.receiver_phone}</p>
                  <p className="text-sm text-gray-600 mt-1">{parcel.receiver_address}</p>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Dolu Rider */}
                <div className="bg-white rounded p-3">
                  <p className="text-sm text-gray-500 mb-1">Dolu Rider</p>
                  {riderName ? (
                    <>
                      <p className="font-medium">{riderName}</p>
                      {riderPhone && (
                        <a
                          href={`tel:${riderPhone}`}
                          className="text-sm text-accent-600 hover:text-accent-700 font-medium"
                        >
                          {riderPhone}
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Not assigned yet</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Package Details & QR Code */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <Package className="w-5 h-5 mr-2 text-primary-500" />
                Package Details
              </h3>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500">Weight:</span>
                    <span className="ml-2">{parcel.weight_kg} kg</span>
                  </div>
                  {parcel.delivery_notes && (
                    <div>
                      <span className="text-gray-500">Notes:</span>
                      <p className="mt-1 text-sm">{parcel.delivery_notes}</p>
                    </div>
                  )}
                </div>
                
                {/* <div className="bg-white p-2 rounded">
                  <QRCode 
                    value={`https://dammydx.github.io/DoluLogistics/track?id=${parcel.tracking_id}`} 
                    size={90} 
                  />
                </div> */}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TrackingDetails;