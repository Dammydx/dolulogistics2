import { NavLink } from 'react-router-dom';
import { Home, Package, MapPin, MessageCircle } from 'lucide-react';

const MobileBottomNav = () => {
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MapPin, label: 'Track', path: '/track' },
    { icon: Package, label: 'Pickup', path: '/request-pickup' },
    { icon: MessageCircle, label: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[2100] transition-all duration-300 backdrop-blur-xl supports-[backdrop-filter]:bg-sky-50/30 bg-sky-50/60 border-t border-sky-200/40 shadow-[0_-8px_30px_rgba(0,40,80,0.08)]">
      <div className="flex items-center justify-around w-full h-16 px-2 pb-[env(safe-area-inset-bottom)] box-content">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all duration-300 ${
                isActive ? 'text-primary-600 scale-110' : 'text-gray-500 hover:text-primary-400'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
