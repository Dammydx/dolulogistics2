import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  Truck,
  MessageCircle,
  Menu,
  X,
  LogOut,
  DollarSign,
  FileText,
  Settings as SettingsIcon,
  Package,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const adminAuth = sessionStorage.getItem('adminAuth');
    if (!adminAuth) {
      navigate('/admin');
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    navigate('/admin');
  };

  if (!isAuthenticated) return null;

  const navItems = [
    {
      to: '/admin/dashboard',
      icon: BarChart3,
      label: 'Dashboard',
    },
    {
      to: '/admin/bookings',
      icon: Truck,
      label: 'Dispatch Desk',
    },
    {
      to: '/admin/messages',
      icon: MessageCircle,
      label: 'Contact Messages',
    },
    {
      to: '/admin/pricing',
      icon: DollarSign,
      label: 'Pricing',
    },
    {
      to: '/admin/templates',
      icon: FileText,
      label: 'Templates',
    },
    {
      to: '/admin/settings',
      icon: SettingsIcon,
      label: 'Settings',
    },
  ];

  return (
    <div className="flex h-screen bg-blue-50">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="hidden md:block bg-blue-950 text-white w-[260px] flex-shrink-0 z-10"
          >
            <div className="p-5 flex items-center space-x-3 border-b border-blue-900">
              <Package className="h-7 w-7 text-lime-400" />
              <span className="text-lg font-semibold tracking-wide">
                Dolu Admin
              </span>
            </div>

            <nav className="mt-6">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-5 py-3 transition-colors ${
                      isActive
                        ? 'bg-blue-900 text-lime-400'
                        : 'text-blue-200 hover:bg-blue-900 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </NavLink>
              ))}

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-5 py-3 mt-4 text-blue-200 hover:bg-red-600 hover:text-white transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-blue-100 z-10">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden md:block text-blue-900"
              >
                <Menu className="h-6 w-6" />
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-blue-900"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              <h1 className="text-xl font-semibold text-blue-900">
                Dashboard
              </h1>
            </div>

            <button
              onClick={handleLogout}
              className="text-sm px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="md:hidden bg-blue-950 text-white"
              >
                <nav className="p-4 space-y-2">
                  {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 rounded ${
                          isActive
                            ? 'bg-blue-900 text-lime-400'
                            : 'text-blue-200 hover:bg-blue-900'
                        }`
                      }
                    >
                      <Icon className="h-5 w-5" />
                      <span>{label}</span>
                    </NavLink>
                  ))}

                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-3 rounded text-blue-200 hover:bg-red-600 hover:text-white"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
