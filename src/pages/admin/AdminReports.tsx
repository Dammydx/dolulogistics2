import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { Booking } from '../../types/database';
import {
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  Package,
  DollarSign,
} from 'lucide-react';
import * as XLSX from 'xlsx';

const AdminReports = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default to current month and year
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter bookings based on selected month
  const filteredBookings = useMemo(() => {
    if (!selectedMonth) return bookings;

    const [year, month] = selectedMonth.split('-');
    
    return bookings.filter((booking) => {
      const date = new Date(booking.created_at);
      return (
        date.getFullYear() === parseInt(year, 10) &&
        date.getMonth() + 1 === parseInt(month, 10)
      );
    });
  }, [bookings, selectedMonth]);

  // Derive metrics
  const metrics = useMemo(() => {
    let totalBookings = 0;
    let delivered = 0;
    let canceled = 0;
    let revenue = 0;

    filteredBookings.forEach((booking) => {
      totalBookings += 1;
      if (booking.status === 'delivered') {
        delivered += 1;
        revenue += booking.price_total; // Only sum delivered for revenue as per user request
      } else if (booking.status === 'cancelled' || booking.status === 'not_accepted') {
        canceled += 1;
      }
    });

    return { totalBookings, delivered, canceled, revenue };
  }, [filteredBookings]);

  const handleDownloadReport = async (onlyDelivered: boolean = false) => {
    const bookingsToExport = onlyDelivered 
      ? filteredBookings.filter(b => b.status === 'delivered') 
      : filteredBookings;

    if (bookingsToExport.length === 0) {
      toast.warning(`No ${onlyDelivered ? 'delivered ' : ''}bookings to export for the selected month.`);
      return;
    }

    try {
      // First, gather area names to display clear routes if needed. 
      // For a synchronous export we might have to do an N+1 query but we can just fetch all areas at once.
      const { data: areasData } = await supabase.from('locations_areas').select('id, name');
      const areaMap = new Map();
      if (areasData) {
        areasData.forEach((a) => areaMap.set(a.id, a.name));
      }

      // Map to columns specifically requested by the user:
      // Date, Tracking ID, Customer, Pickup, Drop-off, Rider, and Status
      const reportData = bookingsToExport.map((booking) => {
        const pickupAreaName = booking.pickup_area_id ? areaMap.get(booking.pickup_area_id) : 'Unknown';
        const dropoffAreaName = booking.dropoff_area_id ? areaMap.get(booking.dropoff_area_id) : 'Unknown';
        
        return {
          'Date': new Date(booking.created_at).toLocaleDateString('en-NG'),
          'Tracking ID': booking.tracking_id,
          'Customer': booking.sender_name,
          'Pickup': `${pickupAreaName} - ${booking.pickup_address}`,
          'Drop-off': `${dropoffAreaName} - ${booking.dropoff_address}`,
          'Rider': booking.rider_name || 'Unassigned',
          'Amount': booking.price_total,
          'Status': booking.status.replace('_', ' ').toUpperCase(),
        };
      });

      // Create Worksheet
      const worksheet = XLSX.utils.json_to_sheet(reportData);

      // Create Workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, onlyDelivered ? 'Delivered Report' : 'Monthly Report');

      // Download
      XLSX.writeFile(workbook, onlyDelivered ? `Dolu_Delivered_Report_${selectedMonth}.xlsx` : `Dolu_Report_${selectedMonth}.xlsx`);
      toast.success('Report downloaded successfully!');
    } catch (err) {
      console.error('Error exporting report:', err);
      toast.error('Failed to export report');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Reports
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            View booking summaries and download monthly reports
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <Calendar className="h-5 w-5 text-gray-500 ml-2" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-none focus:ring-0 text-sm font-medium text-gray-700 bg-transparent min-w-[150px] cursor-pointer"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex items-center">
          <div className="bg-blue-100 p-3 rounded-xl mr-4">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.totalBookings}
            </p>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex items-center">
          <div className="bg-green-100 p-3 rounded-xl mr-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Delivered</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.delivered}
            </p>
          </div>
        </div>

        {/* Canceled */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex items-center">
          <div className="bg-red-100 p-3 rounded-xl mr-4">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Canceled</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.canceled}</p>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex items-center">
          <div className="bg-yellow-100 p-3 rounded-xl mr-4">
            <DollarSign className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              ₦{metrics.revenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            Monthly Bookings Table
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleDownloadReport(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Delivered Only
            </button>
            <button
              onClick={() => handleDownloadReport(false)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              All Reports
            </button>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <Package className="h-12 w-12 text-gray-300 mb-3" />
            <p>No bookings found for the selected month.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tracking ID
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rider
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(booking.created_at).toLocaleDateString('en-NG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {booking.tracking_id}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="font-medium">{booking.sender_name}</div>
                      <div className="text-xs text-gray-500">{booking.sender_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {booking.rider_name || <span className="italic text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₦{booking.price_total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' || booking.status === 'not_accepted' ? 'bg-red-100 text-red-800' :
                        booking.status === 'in_progress' ? 'bg-cyan-100 text-cyan-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
