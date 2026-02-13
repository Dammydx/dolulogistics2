import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ScrollToTop from './components/common/ScrollToTop';

// Layout components
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';

// Pages
import HomePage from './pages/home/HomePage';
import NewTrackPage from './pages/track/NewTrackPage';
import ServicesPage from './pages/services/ServicesPage';
import AboutPage from './pages/about/AboutPage';
import ContactPage from './pages/contact/ContactPage';
import GetQuotePage from './pages/quote/GetQuotePage';
import NewRequestPickupPage from './pages/request/NewRequestPickupPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminMessages from './pages/admin/AdminMessages';
import AdminPricing from './pages/admin/AdminPricing';
import AdminTemplates from './pages/admin/AdminTemplates';
import AdminSettings from './pages/admin/AdminSettings';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>{/* basename="/DevWave"👈 update this to match your repo name */}
      <ScrollToTop />
      <ToastContainer position="top-right" autoClose={5000} />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="track" element={<NewTrackPage />} />
          <Route path="get-quote" element={<GetQuotePage />} />
          <Route path="request-pickup" element={<NewRequestPickupPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="bookings/:id" element={<AdminBookings />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="pricing" element={<AdminPricing />} />
          <Route path="templates" element={<AdminTemplates />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
