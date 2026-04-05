import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, ShieldAlert, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import doluLogo from '../../images/dolu-logo.png';

const ADMIN_PASSWORD = 'Mailpassword1';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        // Store auth state in session storage
        sessionStorage.setItem('adminAuth', 'true');
        toast.success('Login successful');
        navigate('/admin/dashboard');
      } else {
        toast.error('Invalid password');
      }
      setIsLoading(false);
    }, 1000);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs for Premium HQ feel */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] -ml-40 -mt-40"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] -mr-40 -mb-40"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Main Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20">
          <div className="p-8 pb-10 text-center">
            <Link to="/">
              <img src={doluLogo} alt="Dolu Logistics" className="h-20 md:h-24 mx-auto mb-8 drop-shadow-md" />
            </Link>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
              Admin & Dispatch Login
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Central Operations Control
            </p>
          </div>

          <div className="px-8 pb-12 pt-4">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-primary-500" /> Administrative Identity
                </label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Admin Password"
                    className="w-full pl-16 pr-14 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 text-lg font-black transition-all"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-6 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-primary-500 transition-colors"
                    onClick={togglePasswordVisibility}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-6 bg-primary-600 text-white rounded-3xl font-black uppercase text-sm tracking-widest hover:bg-primary-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 group disabled:bg-slate-200"
              >
                {isLoading ? (
                  <span className="flex items-center gap-3">
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </span>
                ) : (
                  <>
                    Login
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <Link
            to="/portal"
            className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-primary-400 uppercase tracking-widest transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;