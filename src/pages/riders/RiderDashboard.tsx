import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { BookingWithDetails } from '../../types/database';
import { toast } from 'react-toastify';
import { 
  CheckCircle2, 
  LogOut, 
  RefreshCcw,
  Clock,
  User as UserIcon,
  X as XIcon,
  Phone,
  MessageCircle,
  Package,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// -- Delivery Slider Component --
const DeliverySlider = ({ 
  isUpdating, 
  onConfirm 
}: { 
  isUpdating: boolean, 
  onConfirm: () => void 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [isSuccess, setIsSuccess] = useState(false);

  // Map drag distance to opacity and other styles if needed
  const textOpacity = useTransform(x, [0, 150], [1, 0]);

  const handleDragEnd = () => {
    const currentX = x.get();
    const width = containerRef.current?.offsetWidth || 0;
    
    if (currentX > width * 0.7) {
      setIsSuccess(true);
      onConfirm();
    } else {
      x.set(0);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="mt-4 relative h-20 sm:h-24 bg-slate-100 rounded-[2rem] p-1.5 flex items-center shadow-inner overflow-hidden border-2 border-slate-200/50"
    >
      {/* Background Label */}
      <motion.div 
        style={{ opacity: textOpacity }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none pr-4"
      >
        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 pl-14">
          Slide to Deliver <ChevronRight className="w-4 h-4 animate-bounce-x" />
        </p>
      </motion.div>

      {/* Success/Updating State Overlay */}
      <AnimatePresence>
        {(isUpdating || isSuccess) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-emerald-500 z-50 flex items-center justify-center gap-3"
          >
            <RefreshCcw className="w-6 h-6 text-white animate-spin" />
            <span className="text-white font-black uppercase text-xs tracking-widest">
              Updating Dispatch...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Draggable Handle */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: containerRef.current ? containerRef.current.offsetWidth - 80 : 300 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ scale: 0.98 }}
        className="relative z-20 w-[4.5rem] h-[4.5rem] sm:w-[5.25rem] sm:h-[5.25rem] bg-accent-400 rounded-full shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing border-b-8 border-accent-600 group"
      >
        <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white group-active:scale-110 transition-transform" />
      </motion.div>
    </div>
  );
};

type ActiveAction = {
  jobId: string;
  type: 'call' | 'whatsapp';
} | null;

const RiderDashboard = () => {
  const [jobs, setJobs] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const navigate = useNavigate();
  const riderId = localStorage.getItem('riderId');
  const riderName = localStorage.getItem('riderName');

  const fetchJobs = async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*, pickup_area:locations_areas!pickup_area_id(name), dropoff_area:locations_areas!dropoff_area_id(name)')
        .eq('assigned_rider_id', riderId)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      if (!isSilent) toast.error('Failed to load active jobs');
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!riderId) {
      navigate('/riders');
      return;
    }
    fetchJobs();
  }, [riderId, navigate]);

  useEffect(() => {
    // Current Time Heartbeat (Every 1m)
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      fetchJobs(true); // Silent Refetch Heartbeat
    }, 60000);
    return () => clearInterval(timer);
  }, [riderId]);

  const handleMarkDelivered = async (booking: BookingWithDetails) => {
    try {
      setIsUpdating(booking.id);
      
      // 1. Update Booking Status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'delivered' })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      // 2. Add Status History
      const { error: historyError } = await supabase
        .from('booking_status_history')
        .insert([
          {
            booking_id: booking.id,
            status: 'delivered',
            note: 'Delivered successfully by rider.',
            created_by: 'system' // or 'rider' if supported
          }
        ]);

      if (historyError) throw historyError;

      toast.success(`Package ${booking.tracking_id} Delivered!`);
      fetchJobs();
    } catch (err) {
      toast.error('Failed to update delivery status');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/riders');
  };

  const openWhatsApp = (phone: string, trackingId: string, role: 'Pickup' | 'Delivery') => {
    const message = `Hello, I am the Dolu Logistics rider for your ${role === 'Pickup' ? 'package pickup' : 'package delivery'} (${trackingId}). I'm currently on my way.`;
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('0') ? '234' + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
    setActiveAction(null);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
    setActiveAction(null);
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((currentTime.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return '1d ago';
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Header */}
      <div className="bg-accent-400 p-6 pt-10 pb-20 rounded-b-[40px] shadow-xl relative overflow-hidden">
        {/* Abstract Background Design */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-300 rounded-full -ml-12 -mb-12 opacity-50"></div>

        <div className="relative z-10 flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2">
              Field Dashboard
            </h1>
            <p className="text-accent-950 font-black uppercase tracking-widest text-[10px] sm:text-sm bg-white/40 px-3 py-1 rounded-lg inline-block">
              Officer: {riderName?.split(' ')[0]}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white active:scale-95 transition-all"
          >
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="relative z-10 bg-slate-900/10 backdrop-blur-md rounded-[2.5rem] p-4 sm:p-5 border border-white/20 flex items-center justify-between shadow-inner">
          <div>
            <p className="text-white/80 text-[10px] sm:text-sm font-black uppercase tracking-widest mb-1">Current Active Jobs</p>
            <p className="text-5xl sm:text-6xl font-black text-white leading-none">{jobs.length}</p>
          </div>
          <button 
            onClick={() => fetchJobs()}
            className={`w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl sm:rounded-3xl flex items-center justify-center text-accent-600 shadow-2xl active:scale-90 transition-all ${isLoading ? 'animate-spin-slow' : ''}`}
          >
            <RefreshCcw className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="px-6 -mt-10 relative z-20 space-y-4">
        {isLoading ? (
          [1, 2].map(n => (
            <div key={n} className="h-64 bg-white/50 animate-pulse rounded-[32px]"></div>
          ))
        ) : jobs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-50 rounded-[32px] p-10 shadow-xl text-center border-2 border-slate-200"
          >
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-2">No Active Load</h2>
            <p className="text-xs text-slate-500 font-medium px-4">
              All caught up! Contact Dispatch to assign new bookings to your queue.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-50 rounded-[2.5rem] p-4 sm:p-6 shadow-xl border-2 border-slate-200"
              >
                {/* Tracking ID Bar */}
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <div className="px-3 py-1.5 sm:px-6 sm:py-3 bg-white rounded-2xl border-2 border-accent-100 shadow-sm flex items-center gap-2">
                          <Package className="w-4 h-4 text-accent-500" />
                          <code className="text-lg sm:text-2xl font-black text-accent-700 tracking-widest font-mono">
                            {job.tracking_id}
                          </code>
                        </div>
                        {index === 0 && (
                          <div className="bg-primary-500 text-white text-[10px] sm:text-[12px] font-black px-3 py-1.5 rounded-xl uppercase tracking-tighter animate-pulse shadow-lg border-b-4 border-primary-700">
                            NEW LOAD
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest pl-1 mt-1">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-500" /> Assigned {getTimeAgo(job.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 shadow-sm shrink-0">
                      <RefreshCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Dispatch
                    </div>
                  </div>
                </div>

                {/* Route Section */}
                <div className="relative pl-6 space-y-6 mb-8">
                  <div className="absolute left-1.5 top-2 bottom-6 w-0.5 border-l-2 border-dashed border-gray-200"></div>
                  
                    {/* Pickup */}
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-5 h-5 bg-blue-500 rounded-full border-4 border-white shadow-sm ring-1 ring-blue-500/30"></div>
                      <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1.5">Pickup Location</div>
                      <p className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                        {job.sender_name} <span className="text-gray-300">•</span> {job.pickup_address}
                      </p>
                      <p className="text-[10px] sm:text-xs font-bold text-gray-400 mt-1 uppercase">{job.pickup_area?.name}</p>
                    </div>
  
                    {/* Drop-off */}
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-5 h-5 bg-accent-500 rounded-full border-4 border-white shadow-sm ring-1 ring-accent-500/30"></div>
                      <div className="text-[10px] font-black text-accent-500 uppercase tracking-[0.2em] mb-1.5">Dest. Location</div>
                      <p className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                        {job.receiver_name} <span className="text-gray-300">•</span> {job.dropoff_address}
                      </p>
                      <p className="text-[10px] sm:text-xs font-bold text-gray-400 mt-1 uppercase">{job.dropoff_area?.name}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="relative">
                  <AnimatePresence>
                    {activeAction?.jobId === job.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-4 shadow-2xl border border-slate-200 mb-2 ring-4 ring-black/5"
                      >
                        <div className="flex items-center justify-between mb-4 px-2">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {activeAction.type === 'call' ? '📞 VOICE CALL' : '💬 WHATSAPP MESSAGE'}
                          </h4>
                          <button onClick={() => setActiveAction(null)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                            <XIcon className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                          <button 
                            onClick={() => activeAction.type === 'call' 
                              ? handleCall(job.sender_phone) 
                              : openWhatsApp(job.sender_phone, job.tracking_id, 'Pickup')}
                            className="bg-blue-600 text-white p-5 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all shadow-lg border-b-4 border-blue-800 active:border-b-0"
                          >
                            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                              <UserIcon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter">Pickup Person</span>
                          </button>
                          <button 
                            onClick={() => activeAction.type === 'call' 
                              ? handleCall(job.receiver_phone) 
                              : openWhatsApp(job.receiver_phone, job.tracking_id, 'Delivery')}
                            className="bg-accent-500 text-white p-5 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all shadow-lg border-b-4 border-accent-700 active:border-b-0"
                          >
                            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                              <UserIcon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter">Delivery Person</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setActiveAction({ jobId: job.id, type: 'call' })}
                      className={`flex-1 min-h-[4.5rem] py-3 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 font-black uppercase text-[10px] sm:text-xs tracking-widest active:scale-95 transition-all shadow-sm ${
                        activeAction?.jobId === job.id && activeAction.type === 'call' 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                      Call
                    </button>
                    <button 
                      onClick={() => setActiveAction({ jobId: job.id, type: 'whatsapp' })}
                      className={`flex-1 min-h-[4.5rem] py-3 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 font-black uppercase text-[10px] sm:text-xs tracking-widest active:scale-95 transition-all shadow-sm ${
                        activeAction?.jobId === job.id && activeAction.type === 'whatsapp' 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-green-50 text-green-700'
                      }`}
                    >
                      <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      WhatsApp
                    </button>
                  </div>
                </div>

                {/* Deliver Swipe Action */}
                <DeliverySlider 
                  isUpdating={isUpdating === job.id} 
                  onConfirm={() => handleMarkDelivered(job)} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Branding */}
      <div className="mt-12 text-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
          Dolu Logistics • Field Operations v1.0
        </p>
      </div>
    </div>
  );
};

export default RiderDashboard;
