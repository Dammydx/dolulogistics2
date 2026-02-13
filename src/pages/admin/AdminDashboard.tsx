import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import {
  Booking,
  DashboardStats,
  BookingStatus,
} from '../../types/database';
import {
  Clock,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  AlertCircle,
  TrendingUp,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatCard {
  status: BookingStatus;
  count: number;
  icon: React.ComponentType<{ className: string }>;
  color: string;
  bgColor: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    pending: 0,
    confirmed: 0,
    not_accepted: 0,
    in_progress: 0,
    delivered: 0,
    cancelled: 0,
    total: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all bookings and get stats
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      if (bookings) {
        // Calculate stats
        const newStats = {
          pending: bookings.filter((b) => b.status === 'pending').length,
          confirmed: bookings.filter((b) => b.status === 'confirmed').length,
          not_accepted: bookings.filter((b) => b.status === 'not_accepted')
            .length,
          in_progress: bookings.filter((b) => b.status === 'in_progress')
            .length,
          delivered: bookings.filter((b) => b.status === 'delivered').length,
          cancelled: bookings.filter((b) => b.status === 'cancelled').length,
          total: bookings.length,
        };

        setStats(newStats);

        // Get recent 5 bookings
        setRecentBookings(bookings.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const statCards: StatCard[] = [
    {
      status: 'pending',
      count: stats.pending,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      status: 'confirmed',
      count: stats.confirmed,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      status: 'in_progress',
      count: stats.in_progress,
      icon: Truck,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      status: 'delivered',
      count: stats.delivered,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      status: 'cancelled',
      count: stats.cancelled,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      status: 'not_accepted',
      count: stats.not_accepted,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const getStatusBadgeColor = (status: BookingStatus) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      not_accepted: 'bg-orange-100 text-orange-800',
    };
    return colors[status];
  };

  const getStatusLabel = (status: BookingStatus) => {
    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      not_accepted: 'Not Accepted',
    };
    return labels[status];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Overview of your logistics operations
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="mt-4 sm:mt-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.status}
              className={`${card.bgColor} p-6 rounded-lg border border-gray-200 shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {getStatusLabel(card.status)}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {card.count}
                  </p>
                </div>
                <Icon className={`${card.color} h-8 w-8 opacity-75`} />
              </div>
            </div>
          );
        })}

        {/* Total Card */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-sm lg:col-span-3 sm:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Bookings
              </p>
              <p className="text-4xl font-bold text-blue-900">
                {stats.total}
              </p>
            </div>
            <Package className="h-12 w-12 text-blue-500 opacity-75" />
          </div>
        </div>
      </div>

      {/* Recent Bookings Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Bookings
          </h2>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No bookings yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <table className="w-full hidden md:table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Tracking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Sender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {booking.tracking_id}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {booking.sender_name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadgeColor(
                          booking.status
                        )}`}
                      >
                        {getStatusLabel(booking.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                      ₦{booking.price_total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/admin/bookings/${booking.id}`}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {booking.tracking_id}
                    </code>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadgeColor(
                        booking.status
                      )}`}
                    >
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {booking.sender_name}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-600">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      ₦{booking.price_total.toLocaleString()}
                    </p>
                  </div>
                  <Link
                    to={`/admin/bookings/${booking.id}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 p-6">
          <Link
            to="/admin/bookings"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Bookings →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;