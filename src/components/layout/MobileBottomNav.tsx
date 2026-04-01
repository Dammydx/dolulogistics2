import { NavLink } from 'react-router-dom';
import { Home, MapPin, PackagePlus, MessageCircle } from 'lucide-react';

const MobileBottomNav = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/track', icon: MapPin, label: 'Track' },
    { to: '/request-pickup', icon: PackagePlus, label: 'Pickup' },
    { to: '/contact', icon: MessageCircle, label: 'Contact' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe transition-all duration-300 backdrop-blur-xl supports-[backdrop-filter]:bg-sky-50/30 bg-sky-50/60 border-t border-sky-200/40 shadow-[0_-8px_30px_rgba(0,40,80,0.08)]">
      <div className="flex items-center justify-around w-full h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-[70px] h-[54px] rounded-xl space-y-1 transition-all duration-200 ${
                isActive 
                  ? 'text-primary-600 bg-sky-100/70' 
                  : 'text-text/80 hover:text-text hover:bg-sky-100/50'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium tracking-wide">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
