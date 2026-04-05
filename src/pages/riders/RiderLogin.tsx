import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { 
  User, 
  Lock, 
  ChevronRight, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import DispatchBikeIcon from '../../components/icons/DispatchBikeIcon';
import { Link } from 'react-router-dom';

const RiderLogin = () => {
  const [username, setUsername] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !pinCode) {
      toast.error('Enter your Username and PIN');
      return;
    }

    try {
      setIsLoading(true);
      
      // Query rider by username and PIN
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('username', username.toLowerCase().trim())
        .eq('pin_code', pinCode)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        throw new Error('Invalid Username or PIN. Please contact Dispatch.');
      }

      // Store in local storage for persistence on mobile
      localStorage.setItem('riderAuth', 'true');
      localStorage.setItem('riderId', data.id);
      localStorage.setItem('riderName', data.full_name);
      
      toast.success(`Welcome back, ${data.full_name.split(' ')[0]}!`);
      navigate('/riders/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Banner (Lemon Green) */}
      <div className="bg-accent-400 p-8 pt-8 pb-12 flex flex-col items-center shrink-0">
         <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6 rotate-12 border-4 border-accent-100"
        >
          <DispatchBikeIcon className="w-8 h-8 text-accent-600" />
        </motion.div>
        
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter text-center leading-none">
          Field Operations
        </h1>
        <p className="text-accent-950/60 text-[10px] font-black uppercase tracking-widest mt-2">
          Rider Portal Login
        </p>
      </div>

      {/* Login Form */}
      <div className="flex-1 px-6 pt-10 pb-12 -mt-10 bg-slate-100 rounded-t-[40px] shadow-2xl z-10">
        <form onSubmit={handleLogin} className="space-y-5 max-w-sm mx-auto mt-2" autoComplete="off">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Rider Username</label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-600 transition-colors" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. amaana"
                autoComplete="off"
                className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-accent-500/10 focus:border-accent-400 text-lg font-black transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Security PIN</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-600 transition-colors" />
              <input 
                type="password" 
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="new-password"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="****"
                className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-accent-500/10 focus:border-accent-400 text-xl font-black tracking-[0.5em] transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="pt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 bg-accent-400 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest hover:bg-accent-500 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 group disabled:bg-gray-200 border-b-8 border-accent-600 active:border-b-0"
            >
              {isLoading ? (
                'Verifying...'
              ) : (
                <>
                  Enter Dashboard
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 flex items-start gap-4 bg-white/50 p-4 rounded-2xl max-w-sm mx-auto border border-slate-200/50">
          <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed font-bold">
            Contact Dispatch for PIN resets or login issues.
          </p>
        </div>

        <div className="text-center mt-8">
          <Link 
            to="/portal" 
            className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-accent-600 uppercase tracking-widest transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Portal Gateway
          </Link>
          <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            Dolu Logistics Control
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderLogin;
