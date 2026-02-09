import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Logo import (file is inside: src/assets/images/dolu-logo.png)
// If your Navbar file is not in the same folder level, adjust the ../ accordingly.
import doluLogo from '../../assets/images/dolu-logo.png';

const navItems = [
  { title: 'Home', path: '/' },
  { title: 'Track', path: '/track' },
  { title: 'Get Quote', path: '/get-quote' },
  { title: 'Request Pickup', path: '/request-pickup' },
  { title: 'Services', path: '/services' },
  { title: 'About', path: '/about' },
  { title: 'Contact', path: '/contact' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => closeMenu(), [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ FIXED: cleanup must return void (TypeScript friendly)
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <header
      className={[
        'fixed top-0 w-full z-50 transition-all duration-300',
        // 🔹 SOFT LIGHT-BLUE GLASS (not white)
        'backdrop-blur-xl supports-[backdrop-filter]:bg-sky-50/30',
        'bg-sky-50/60',
        'border-b border-sky-200/40',
        isScrolled
          ? 'py-2 shadow-[0_8px_30px_rgba(0,40,80,0.08)]'
          : 'py-4 shadow-none',
      ].join(' ')}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">
          {/* ✅ Logo (image only) */}
          <Link to="/" className="flex items-center">
            <img
              src={doluLogo}
              alt="Dolu Logistics Logo"
              className="h-14 md:h-16 w-auto object-contain"
            />
            {/* 
              🔧 LOGO SIZE GUIDE:
              - Increase height: change h-12 / md:h-14 to h-14 / md:h-16 etc.
              - Example: className="h-14 md:h-16 w-auto object-contain"
              - Keep w-auto + object-contain so it never stretches.
            */}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <div className="rounded-2xl bg-sky-50/40 border border-sky-200/40 backdrop-blur-xl px-2 py-2 shadow-sm">
              <div className="flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.title}
                    to={item.path}
                    className={({ isActive }) =>
                      [
                        'relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                        'text-text/80 hover:text-text',
                        'hover:bg-sky-100/50',
                        isActive ? 'text-primary-600 bg-sky-100/70' : '',
                      ].join(' ')
                    }
                  >
                    {item.title}
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-text focus:outline-none"
            aria-label="Toggle menu"
          >
            <div className="h-11 w-11 rounded-2xl bg-sky-50/40 border border-sky-200/40 backdrop-blur-xl flex items-center justify-center shadow-sm">
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden"
          >
            <div className="container mx-auto px-4 pb-5">
              <div className="mt-4 rounded-3xl bg-sky-50/50 border border-sky-200/40 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,40,80,0.15)] overflow-hidden">
                <div className="p-3 flex flex-col gap-2">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.title}
                      to={item.path}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        [
                          'px-4 py-3 rounded-2xl text-base font-medium transition-all',
                          isActive
                            ? 'bg-sky-100/70 text-primary-600'
                            : 'text-text/80 hover:text-text hover:bg-sky-100/50',
                        ].join(' ')
                      }
                    >
                      {item.title}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;