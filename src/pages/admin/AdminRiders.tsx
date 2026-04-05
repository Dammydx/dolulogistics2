import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Rider, RiderStatus } from '../../types/database';
import { toast } from 'react-toastify';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Shield, 
  ShieldOff, 
  Key,
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminRiders = () => {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<RiderStatus>('active');
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({});
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase
        .from('riders')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setRiders(data);
        // Fetch active job counts for all active riders
        const counts: Record<string, number> = {};
        await Promise.all(data.map(async (rider) => {
          const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_rider_id', rider.id)
            .eq('status', 'in_progress');
          counts[rider.id] = count || 0;
        }));
        setJobCounts(counts);
      }
    } catch (err) {
      console.error('Error fetching riders:', err);
      toast.error('Failed to load fleet data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !phoneNumber || !pinCode) {
      toast.error('All fields are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('riders').insert([
        {
          full_name: fullName,
          username: username.toLowerCase().trim(),
          phone_number: phoneNumber,
          pin_code: pinCode, // PIN is stored as-is for this version as per user request for simplicity
          status: 'active'
        }
      ]);

      if (error) {
        if (error.code === '23505') throw new Error('Username already exists');
        throw error;
      }

      toast.success('Rider added successfully');
      setShowAddModal(false);
      resetForm();
      fetchRiders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add rider');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (rider: Rider) => {
    const newStatus: RiderStatus = rider.status === 'active' ? 'archived' : 'active';
    try {
      const { error } = await supabase
        .from('riders')
        .update({ status: newStatus })
        .eq('id', rider.id);

      if (error) throw error;
      
      toast.success(`Rider ${newStatus === 'active' ? 'activated' : 'archived'}`);
      fetchRiders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRider || !pinCode) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('riders')
        .update({ pin_code: pinCode })
        .eq('id', selectedRider.id);

      if (error) throw error;

      toast.success('PIN reset successful');
      setShowResetModal(false);
      setPinCode('');
      setSelectedRider(null);
    } catch (err) {
      toast.error('Failed to reset PIN');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setPhoneNumber('');
    setPinCode('');
  };

  const filteredRiders = riders.filter(r => 
    r.status === activeTab &&
    (r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     r.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
     r.phone_number.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tighter">
            Fleet Management
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Manage your delivery personnel and field security
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-primary-600 transition-all shadow-custom-md active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Add New Rider
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-custom-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-gray-50 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'active' ? 'bg-white shadow-sm text-primary-500' : 'text-gray-400'
              }`}
            >
              Active Team
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'archived' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-400'
              }`}
            >
              Archive
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, username or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Rider Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-48 bg-gray-100 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredRiders.map((rider) => (
              <motion.div
                key={rider.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-custom-sm p-6 hover:shadow-custom-md transition-all group relative overflow-hidden"
              >
                {/* Status Indicator */}
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 transition-all group-hover:scale-110 rotate-45 ${
                  rider.status === 'active' ? 'bg-green-50' : 'bg-amber-50'
                }`}></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-14 h-14 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white shadow-xl">
                        <span className="text-xl font-black">{rider.full_name.charAt(0)}</span>
                      </div>
                      {jobCounts[rider.id] > 0 && (
                        <div className="bg-primary-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                          {jobCounts[rider.id]} ACTIVE
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                       <button
                        onClick={() => {
                          setSelectedRider(rider);
                          setShowResetModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all text-xs font-bold uppercase tracking-tighter"
                      >
                        <Key className="w-3.5 h-3.5" />
                        Reset PIN
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to ${rider.status === 'active' ? 'Archive' : 'Restore'} this rider?`)) {
                            handleStatusToggle(rider);
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-tighter ${
                          rider.status === 'active' 
                            ? 'text-gray-500 hover:text-amber-600 hover:bg-amber-50' 
                            : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {rider.status === 'active' ? (
                          <><Clock className="w-3.5 h-3.5" /> Archive</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Restore</>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-none mb-1">
                      {rider.full_name}
                    </h3>
                    <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-4">
                      @{rider.username}
                    </p>

                    <div className="space-y-2 mt-4 pt-4 border-t border-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                          <Phone className="w-3.5 h-3.5" />
                          {rider.phone_number}
                        </div>
                        {jobCounts[rider.id] === 0 && rider.status === 'active' && (
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Available</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        {rider.status === 'active' ? (
                          <><Shield className="w-3.5 h-3.5 text-green-500" /> Authorized Personnel</>
                        ) : (
                          <><ShieldOff className="w-3.5 h-3.5 text-amber-500" /> Archived</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredRiders.length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                No riders found in {activeTab}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Rider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-custom-lg max-w-md w-full p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Add Field Personnel</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddRider} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Amaana John"
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500/20 text-sm font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="amaana"
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500/20 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Security PIN</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="1234"
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500/20 text-sm font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+234..."
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500/20 text-sm font-bold"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary-600 transition-all active:scale-95 disabled:bg-gray-200"
                >
                  {isSubmitting ? 'Registering...' : 'Register Rider'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {showResetModal && selectedRider && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-custom-lg max-w-sm w-full p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Reset Security PIN</h2>
              <button onClick={() => setShowResetModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-xs font-medium text-gray-500 mb-6">
              Assigning a new PIN for <span className="text-gray-900 font-bold">@{selectedRider.username}</span>. 
              The old PIN will be immediately overwritten.
            </p>

            <form onSubmit={handleResetPin} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">New Security PIN</label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Enter 4-6 digits"
                  autoFocus
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500/20 text-sm font-bold"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !pinCode}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all active:scale-95 disabled:bg-gray-200"
                >
                  {isSubmitting ? 'Updating...' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminRiders;
