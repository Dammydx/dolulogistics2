import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, UserCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import doluLogo from '../../images/dolu-logo.png';

const PortalGateway = () => {
  return (
    <div className="min-h-screen bg-[#F7FAFF] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full"
      >
        {/* Logo Section */}
        <div className="text-center mb-16">
          <Link to="/">
            <img src={doluLogo} alt="Dolu Logistics" className="h-32 md:h-40 mx-auto mb-6 drop-shadow-xl" />
          </Link>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">
            Staff Access Portal
          </h1>
          <p className="text-gray-500 text-base mt-3 font-bold uppercase tracking-widest">
            Internal Operations & Field Management
          </p>
        </div>

        {/* Access Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {/* Admin / Dispatch */}
          <Link to="/admin" className="group">
            <div className="h-full bg-white border-2 border-transparent hover:border-primary-500 rounded-3xl p-8 shadow-custom-lg transition-all active:scale-95 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-500 transition-colors">
                <ShieldCheck className="w-8 h-8 text-primary-500 group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-2">
                Admin & Dispatch
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Manage bookings, pricing, and overall logistics operations.
              </p>
            </div>
          </Link>

          {/* Riders / Field */}
          <Link to="/riders" className="group">
            <div className="h-full bg-white border-2 border-transparent hover:border-accent-500 rounded-3xl p-8 shadow-custom-lg transition-all active:scale-95 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-accent-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent-500 transition-colors">
                <UserCheck className="w-8 h-8 text-accent-500 group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-2">
                Field Rider Login
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Access your active delivery jobs and mark successful packages.
              </p>
            </div>
          </Link>
        </div>

        {/* Security Warning */}
        <div className="bg-amber-50/50 backdrop-blur-sm border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
          <div className="bg-amber-100 p-2 rounded-lg shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1">
              Restricted Area
            </h3>
            <p className="text-[10px] md:text-xs text-amber-800 leading-relaxed font-medium">
              This portal is strictly for authorized Dolu Logistics personnel. All access attempts are logged and monitored. 
              If you are a customer looking to book a delivery or track a package, please{' '}
              <Link to="/" className="underline font-black hover:text-amber-950">
                return to the homepage
              </Link>.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-primary-500 uppercase tracking-widest transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Website
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PortalGateway;
