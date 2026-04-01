import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';

const Layout = () => {
  useEffect(() => {
    // Add visibility change listener to maintain active state
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reconnect or refresh data if needed when tab becomes visible again
        console.log('Tab is now active');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background font-inter text-text pb-[64px] md:pb-0">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Layout;