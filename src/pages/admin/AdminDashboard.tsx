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
  AlertTriangle,
  TrendingUp,
  Eye,
  LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Fixed: Interface using LucideIcon
interface StatCard {
  status: BookingStatus;
  count: number;
  icon: LucideIcon;
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

    // REAL-TIME: Fixed with schema and payload to remove TS errors
    const channel = supabase
      .channel('admin-dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('New booking detected:', payload);
          fetchDashboardData();
          toast.info('New Booking Received!', {
            position: "bottom-right",
            autoClose: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      if (bookings) {
        const newStats = {
          pending: bookings.filter((b) => b.status === 'pending').length,
          confirmed: bookings.filter((b) => b.status === 'confirmed').length,
          not_accepted: bookings.filter((b) => b.status === 'not_accepted').length,
          in_progress: bookings.filter((b) => b.status === 'in_progress').length,
          delivered: bookings.filter((b) => b.status === 'delivered').length,
          cancelled: bookings.filter((b) => b.status === 'cancelled').length,
          total: bookings.length,
        };

        setStats(newStats);
        setRecentBookings(bookings.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const statCards: StatCard[] = [
    { status: 'pending', count: stats.pending, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { status: 'confirmed', count: stats.confirmed, icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { status: 'in_progress', count: stats.in_progress, icon: Truck, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    { status: 'delivered', count: stats.delivered, icon: Package, color: 'text-green-600', bgColor: 'bg-green-50' },
    { status: 'cancelled', count: stats.cancelled, icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
    { status: 'not_accepted', count: stats.not_accepted, icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-50' },
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
          <p className="text-gray-600 font-medium">Loading Dolu Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">Real-time Overview of Dolu Logistics</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="mt-4 sm:mt-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.status} className={`${card.bgColor} p-6 rounded-lg border border-gray-200 shadow-sm`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{getStatusLabel(card.status)}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.count}</p>
                </div>
                <Icon className={`${card.color} h-8 w-8 opacity-75`} />
              </div>
            </div>
          );
        })}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-sm lg:col-span-3 sm:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Bookings</p>
              <p className="text-4xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <Package className="h-12 w-12 text-blue-500 opacity-75" />
          </div>
        </div>
      </div>

      {/* Action Required: Confirmed bookings needing riders */}
      {stats.confirmed > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-amber-800 text-base">⚡ Action Required: {stats.confirmed} Confirmed Booking{stats.confirmed > 1 ? 's' : ''} Awaiting Dispatch</h3>
              <p className="text-amber-700 text-sm mt-0.5">
                Assign a rider and change status to <strong>"In Progress"</strong> to dispatch.
              </p>
            </div>
          </div>
          <Link
            to="/admin/bookings"
            className="flex-shrink-0 px-5 py-2.5 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors text-sm whitespace-nowrap"
          >
            Go to Dispatch Desk →
          </Link>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
        </div>
        {recentBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No bookings yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full hidden md:table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-semibold text-gray-700 uppercase">
                  <th className="px-6 py-3">Tracking ID</th>
                  <th className="px-6 py-3">Sender</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><code className="font-mono bg-gray-100 px-2 py-1 rounded">{booking.tracking_id}</code></td>
                    <td className="px-6 py-4 text-gray-700">{booking.sender_name}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold px-3 py-1 rounded-full text-xs ${getStatusBadgeColor(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">₦{booking.price_total.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(booking.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><Link to={`/admin/bookings/${booking.id}`} className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"><Eye className="h-4 w-4" /> View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="md:hidden space-y-3 p-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between mb-3">
                    <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{booking.tracking_id}</code>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadgeColor(booking.status)}`}>{getStatusLabel(booking.status)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{booking.sender_name}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">{new Date(booking.created_at).toLocaleDateString()}</p>
                    <p className="text-sm font-bold text-gray-900">₦{booking.price_total.toLocaleString()}</p>
                  </div>
                  <Link to={`/admin/bookings/${booking.id}`} className="mt-3 block text-center bg-gray-50 py-2 rounded text-blue-600 text-xs font-semibold">View Details</Link>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="border-t border-gray-200 p-6 text-center">
          <Link to="/admin/bookings" className="text-blue-600 hover:underline font-medium text-sm">View All Bookings →</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;