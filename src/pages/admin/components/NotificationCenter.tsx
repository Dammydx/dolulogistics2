import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Bell, 
  Package, 
  MessageSquare, 
  X,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationItem {
  id: string;
  type: 'booking_pending' | 'booking_confirmed' | 'message_new';
  title: string;
  description: string;
  timestamp: string;
  link: string;
}

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Real-time listeners
    const bookingsChannel = supabase
      .channel('notification-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchNotifications())
      .subscribe();

    const messagesChannel = supabase
      .channel('notification-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => fetchNotifications())
      .subscribe();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(messagesChannel);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // 1. Fetch Pending Bookings
      const { data: pendingBookings } = await supabase
        .from('bookings')
        .select('id, tracking_id, sender_name, created_at')
        .eq('status', 'pending')
        .gte('created_at', twentyFourHoursAgo);

      // 2. Fetch Confirmed Bookings (Awaiting Dispatch)
      const { data: confirmedBookings } = await supabase
        .from('bookings')
        .select('id, tracking_id, sender_name, created_at')
        .eq('status', 'confirmed')
        .is('assigned_rider_id', null)
        .gte('created_at', twentyFourHoursAgo);

      // 3. Fetch New Messages
      const { data: newMessages } = await supabase
        .from('contact_messages')
        .select('id, name, subject, created_at')
        .eq('status', 'new')
        .gte('created_at', twentyFourHoursAgo);

      const items: NotificationItem[] = [];

      pendingBookings?.forEach(b => {
        items.push({
          id: `p-${b.id}`,
          type: 'booking_pending',
          title: 'Payment Pending',
          description: `${b.sender_name} (${b.tracking_id}) is awaiting payment confirmation.`,
          timestamp: b.created_at,
          link: '/admin/bookings'
        });
      });

      confirmedBookings?.forEach(b => {
        items.push({
          id: `c-${b.id}`,
          type: 'booking_confirmed',
          title: 'Dispatch Required',
          description: `Confirmed booking ${b.tracking_id} needs a rider assigned.`,
          timestamp: b.created_at,
          link: '/admin/bookings'
        });
      });

      newMessages?.forEach(m => {
        items.push({
          id: `m-${m.id}`,
          type: 'message_new',
          title: 'New Inquiry',
          description: `New message from ${m.name}: ${m.subject || 'No Subject'}`,
          timestamp: m.created_at,
          link: '/admin/messages'
        });
      });

      // Sort by newest first
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(items);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return '1d ago';
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed inset-x-4 top-20 mx-auto max-w-sm sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">Today's Activity</h3>
                <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Last 24h
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-[70vh] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-gray-400">Syncing...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">All caught up!</p>
                  <p className="text-xs text-gray-500 mt-1">No unaddressed items in the last 24 hours.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((item) => (
                    <Link
                      key={item.id}
                      to={item.link}
                      onClick={() => setIsOpen(false)}
                      className="block p-4 hover:bg-blue-50/50 transition-colors group"
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          item.type === 'booking_pending' ? 'bg-amber-100 text-amber-600' :
                          item.type === 'booking_confirmed' ? 'bg-blue-100 text-blue-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {item.type === 'booking_pending' && <Clock className="w-5 h-5" />}
                          {item.type === 'booking_confirmed' && <Package className="w-5 h-5" />}
                          {item.type === 'message_new' && <MessageSquare className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight">{item.title}</h4>
                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{getTimeAgo(item.timestamp)}</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed font-medium">
                            {item.description}
                          </p>
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Address Now <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* View All */}
            <div className="p-3 bg-gray-50 border-t border-gray-100">
              <Link
                to="/admin/bookings"
                onClick={() => setIsOpen(false)}
                className="block text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors"
              >
                Go to Dispatch Desk
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default NotificationCenter;
