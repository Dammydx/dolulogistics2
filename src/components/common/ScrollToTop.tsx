import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    try {
      // Force immediate jump to top for window and inner containers
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
    } catch (err) {
      // Fallback for older browsers
      window.scrollTo(0, 0);
    }
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
